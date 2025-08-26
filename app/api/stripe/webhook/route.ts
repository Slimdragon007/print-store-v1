import Stripe from 'stripe';
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { initializeServerAnalytics, trackServerPurchase, trackServerRefund } from '@/lib/analytics/server-analytics';
import { getServerAnalyticsConfig } from '@/lib/analytics/config';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Initialize server analytics
const analyticsConfig = getServerAnalyticsConfig();
if (analyticsConfig.measurementId && analyticsConfig.apiSecret) {
  initializeServerAnalytics(analyticsConfig);
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Track successful purchase
      if (session.payment_status === 'paid' && session.amount_total) {
        try {
          // Get line items to track individual products
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product']
          });

          const items = lineItems.data.map(item => {
            const product = item.price?.product as Stripe.Product;
            return {
              id: product?.id || 'unknown',
              title: product?.name || 'Unknown Product',
              price: (item.amount_total || 0) / 100,
              quantity: item.quantity || 1,
              category: 'prints'
            };
          });

          await trackServerPurchase({
            transactionId: session.id,
            items: items,
            totalValue: session.amount_total / 100,
            currency: session.currency?.toUpperCase() || 'USD',
            tax: session.total_details?.amount_tax ? session.total_details.amount_tax / 100 : undefined,
            shipping: session.total_details?.amount_shipping ? session.total_details.amount_shipping / 100 : undefined,
            userId: session.customer as string | undefined,
            userProperties: {
              payment_method: session.payment_method_types?.[0] || 'unknown',
              session_mode: session.mode
            }
          });
        } catch (error) {
          console.error('Failed to track purchase:', error);
        }
      }
      break;

    case 'invoice.payment_failed':
      // Handle failed payments if needed
      break;

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
