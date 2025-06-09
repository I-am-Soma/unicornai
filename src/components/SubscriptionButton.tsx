import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { createCheckoutSession } from '../utils/stripe';
import { STRIPE_PRODUCTS } from '../stripe-config';

interface SubscriptionButtonProps {
  productId: keyof typeof STRIPE_PRODUCTS;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  fullWidth?: boolean;
}

export default function SubscriptionButton({
  productId,
  variant = 'contained',
  color = 'primary',
  fullWidth = false,
}: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const product = STRIPE_PRODUCTS[productId];
      const checkoutUrl = await createCheckoutSession(product.priceId, product.mode);
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      onClick={handleSubscribe}
      disabled={loading}
      fullWidth={fullWidth}
      startIcon={loading ? <CircularProgress size={20} /> : null}
    >
      {loading ? 'Processing...' : `Subscribe to ${STRIPE_PRODUCTS[productId].name}`}
    </Button>
  );
}