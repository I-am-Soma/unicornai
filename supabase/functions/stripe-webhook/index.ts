// supabase/functions/stripe-webhook/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Verificar firma de Stripe
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    console.log('📨 Webhook received:', event.type);

    // ============================================
    // 💰 PAYMENT INTENT SUCCEEDED (Top-up exitoso)
    // ============================================
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      const userId = paymentIntent.metadata.user_id;
      const type = paymentIntent.metadata.type;
      const amount = paymentIntent.amount / 100; // Convertir de centavos a dólares

      console.log('✅ Payment succeeded:', {
        userId,
        type,
        amount,
        paymentIntentId: paymentIntent.id,
      });

      if (type === 'wallet_topup') {
        // 1️⃣ Registrar transacción
        const { error: transactionError } = await supabase
          .from('wallet_transactions')
          .insert({
            user_id: userId,
            amount,
            type: 'topup',
            status: 'completed',
            stripe_payment_intent: paymentIntent.id,
            description: `Wallet top-up via Stripe`,
          });

        if (transactionError) {
          console.error('❌ Error creating transaction:', transactionError);
          throw transactionError;
        }

        console.log('✅ Transaction recorded');

        // 2️⃣ Incrementar balance del wallet
        const { error: walletError } = await supabase.rpc('increment_wallet_balance', {
          uid: userId,
          amount,
        });

        if (walletError) {
          console.error('❌ Error updating wallet:', walletError);
          throw walletError;
        }

        console.log('✅ Wallet balance updated');

        // 3️⃣ Verificar nuevo balance
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', userId)
          .single();

        console.log('💰 New wallet balance:', wallet?.balance);

        return new Response(
          JSON.stringify({
            received: true,
            message: 'Wallet topped up successfully',
            new_balance: wallet?.balance,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // ============================================
    // ❌ PAYMENT INTENT FAILED
    // ============================================
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      const userId = paymentIntent.metadata.user_id;
      const amount = paymentIntent.amount / 100;

      console.log('❌ Payment failed:', {
        userId,
        amount,
        paymentIntentId: paymentIntent.id,
      });

      // Registrar transacción fallida
      await supabase.from('wallet_transactions').insert({
        user_id: userId,
        amount,
        type: 'topup',
        status: 'failed',
        stripe_payment_intent: paymentIntent.id,
        description: `Failed wallet top-up`,
      });

      return new Response(
        JSON.stringify({
          received: true,
          message: 'Payment failure recorded',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // 🔄 CHECKOUT SESSION COMPLETED (Backup)
    // ============================================
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const userId = session.metadata?.user_id;
      const type = session.metadata?.type;

      console.log('✅ Checkout session completed:', {
        userId,
        type,
        sessionId: session.id,
      });

      // Este evento es redundante con payment_intent.succeeded
      // pero lo mantenemos como respaldo
      
      return new Response(
        JSON.stringify({
          received: true,
          message: 'Checkout session completed',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // 💳 CUSTOMER SUBSCRIPTION EVENTS (Futuro)
    // ============================================
    if (event.type === 'customer.subscription.created') {
      console.log('📝 Subscription created');
      // TODO: Implementar lógica de suscripciones si es necesario
    }

    if (event.type === 'customer.subscription.updated') {
      console.log('🔄 Subscription updated');
      // TODO: Manejar cambios de suscripción
    }

    if (event.type === 'customer.subscription.deleted') {
      console.log('❌ Subscription cancelled');
      // TODO: Manejar cancelación de suscripción
    }

    // ============================================
    // ✅ EVENTO RECIBIDO PERO NO PROCESADO
    // ============================================
    console.log('ℹ️ Unhandled event type:', event.type);
    
    return new Response(
      JSON.stringify({
        received: true,
        message: `Event ${event.type} received but not processed`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('❌ Webhook error:', err.message);
    
    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
