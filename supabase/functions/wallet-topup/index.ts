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

/* ============================
   CORS HELPERS (CORRECTO)
   ============================ */
function corsHeaders(extra: Record<string, string> = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...extra,
  };
}

Deno.serve(async (req) => {
  /* ============================
     PRE-FLIGHT
     ============================ */
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  /* ============================
     METHOD VALIDATION
     ============================ */
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  }

  try {
    /* ============================
       AUTH
       ============================ */
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        {
          status: 401,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
        }
      );
    }

    /* ============================
       BODY
       ============================ */
    const { amount } = await req.json();

    if (!amount || typeof amount !== 'number' || amount < 5) {
      return new Response(
        JSON.stringify({ error: 'Minimum top-up is $5 USD' }),
        {
          status: 400,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
        }
      );
    }

    /* ============================
       STRIPE CUSTOMER
       ============================ */
    let customerId: string;

    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingCustomer?.customer_id) {
      customerId = existingCustomer.customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          user_id: user.id,
        },
      });

      await supabase.from('stripe_customers').insert({
        user_id: user.id,
        customer_id: customer.id,
      });

      customerId = customer.id;
    }

    /* ============================
       CHECKOUT SESSION
       ============================ */
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Unicorn Wallet Top-up',
              description: `Add $${amount} USD to your Unicorn wallet`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        type: 'wallet_topup',
        amount: amount.toString(),
      },
      success_url: `${Deno.env.get(
        'FRONTEND_URL'
      )}/campaigns?topup=success`,
      cancel_url: `${Deno.env.get(
        'FRONTEND_URL'
      )}/campaigns?topup=cancel`,
    });

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  } catch (error: any) {
    console.error('wallet-topup error:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  }
});
