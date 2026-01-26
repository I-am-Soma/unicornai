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

function corsResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsResponse({}, 204);
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return corsResponse({ error: 'Unauthorized' }, 401);
    }

    const { amount } = await req.json();
    
    if (!amount || amount < 5) {
      return corsResponse({ error: 'Minimum top-up is $5' }, 400);
    }

    // Crear o obtener Stripe customer
    let customerId: string;
    
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();

    if (customer?.customer_id) {
      customerId = customer.customer_id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      
      await supabase.from('stripe_customers').insert({
        user_id: user.id,
        customer_id: newCustomer.id,
      });
      
      customerId = newCustomer.id;
    }

    // Crear Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Unicorn Wallet Top-up',
            description: `Add $${amount} to your advertising wallet`,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      metadata: {
        user_id: user.id,
        type: 'wallet_topup',
        amount: amount.toString(),
      },
      success_url: `${Deno.env.get('FRONTEND_URL')}/campaigns?topup=success`,
      cancel_url: `${Deno.env.get('FRONTEND_URL')}/campaigns?topup=cancel`,
    });

    return corsResponse({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Top-up error:', error);
    return corsResponse({ error: error.message }, 500);
  }
});
