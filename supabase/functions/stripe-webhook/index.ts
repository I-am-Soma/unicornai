// supabase/functions/stripe-webhook/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

/* =========================
   INIT CLIENTS
========================= */
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

/* =========================
   WEBHOOK HANDLER
========================= */
Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('📨 Webhook received:', event.type)

    /* =====================================================
       💰 PAYMENT INTENT SUCCEEDED (WALLET TOP-UP REAL)
    ===================================================== */
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      const userId = paymentIntent.metadata?.user_id
      const type = paymentIntent.metadata?.type
      const amount = paymentIntent.amount / 100

      if (!userId || type !== 'wallet_topup') {
        console.log('ℹ️ Payment ignored (not wallet topup)')
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      console.log('✅ Payment succeeded:', {
        userId,
        amount,
        paymentIntentId: paymentIntent.id,
      })

      /* ---------- IDEMPOTENCY GUARD ---------- */
      const { data: existingTx } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('stripe_payment_intent', paymentIntent.id)
        .maybeSingle()

      if (existingTx) {
        console.log('⚠️ Payment already processed, skipping credit')
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      /* ---------- REGISTER TRANSACTION ---------- */
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          amount,
          type: 'topup',
          status: 'completed',
          stripe_payment_intent: paymentIntent.id,
          description: 'Wallet top-up via Stripe',
        })

      if (txError) {
        console.error('❌ Error inserting transaction:', txError)
        throw txError
      }

      /* ---------- INCREMENT WALLET ---------- */
      const { error: walletError } = await supabase.rpc(
        'increment_wallet_balance',
        {
          uid: userId,
          amount,
        }
      )

      if (walletError) {
        console.error('❌ Error incrementing wallet:', walletError)
        throw walletError
      }

      /* ---------- VERIFY BALANCE ---------- */
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single()

      console.log('💰 Wallet credited. New balance:', wallet?.balance)

      return new Response(
        JSON.stringify({
          received: true,
          success: true,
          new_balance: wallet?.balance,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    /* =====================================================
       ❌ PAYMENT FAILED
    ===================================================== */
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      const userId = paymentIntent.metadata?.user_id
      const amount = paymentIntent.amount / 100

      if (userId) {
        await supabase.from('wallet_transactions').insert({
          user_id: userId,
          amount,
          type: 'topup',
          status: 'failed',
          stripe_payment_intent: paymentIntent.id,
          description: 'Failed wallet top-up',
        })
      }

      console.log('❌ Payment failed recorded')
      return new Response(JSON.stringify({ received: true }), { status: 200 })
    }

    /* =====================================================
       🔄 CHECKOUT COMPLETED (NO CREDIT HERE)
    ===================================================== */
    if (event.type === 'checkout.session.completed') {
      console.log('ℹ️ Checkout session completed (handled by payment_intent)')
      return new Response(JSON.stringify({ received: true }), { status: 200 })
    }

    /* =====================================================
       ℹ️ OTHER EVENTS
    ===================================================== */
    console.log('ℹ️ Event ignored:', event.type)
    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (err: any) {
    console.error('❌ Webhook error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
