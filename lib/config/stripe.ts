export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  
  // Shipping settings
  shippingCountries: ['US', 'CA', 'GB', 'AU', 'NZ', 'FR', 'DE', 'IT', 'ES'],
  
  // Shipping rates
  shippingRates: {
    standard: {
      amount: 500, // $5.00
      name: 'Standard Shipping',
      deliveryMin: 5,
      deliveryMax: 10,
    },
    express: {
      amount: 1500, // $15.00
      name: 'Express Shipping',
      deliveryMin: 2,
      deliveryMax: 3,
    }
  },
  
  // Currency
  currency: 'usd',
  
  // URLs
  successUrl: '/success',
  cancelUrl: '/cart',
};