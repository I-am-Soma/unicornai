import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { getSubscriptionStatus } from '../utils/stripe';

export default function SubscriptionStatus() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptionStatus();
      setSubscription(data);
    } catch (err) {
      setError('Failed to load subscription status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex\" alignItems="center\" gap={2}>
        <CircularProgress size={20} />
        <Typography>Loading subscription status...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error">
        {error}
      </Typography>
    );
  }

  if (!subscription) {
    return (
      <Typography>
        No active subscription
      </Typography>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trialing':
        return 'info';
      case 'past_due':
        return 'warning';
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="subtitle1">
          Subscription Status:
        </Typography>
        <Chip
          label={subscription.subscription_status}
          color={getStatusColor(subscription.subscription_status)}
          size="small"
        />
      </Box>

      {subscription.payment_method_brand && (
        <Typography variant="body2" color="text.secondary">
          Payment Method: {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
        </Typography>
      )}

      {subscription.current_period_end && (
        <Typography variant="body2" color="text.secondary">
          Current Period Ends: {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
        </Typography>
      )}

      {subscription.cancel_at_period_end && (
        <Typography variant="body2" color="warning.main" mt={1}>
          Your subscription will end at the end of the current period
        </Typography>
      )}
    </Box>
  );
}