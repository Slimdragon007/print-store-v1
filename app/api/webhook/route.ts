import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle successful payment
        console.log('✅ Payment successful for session:', session.id);
        
        // Here you can:
        // 1. Save order to database
        // 2. Send confirmation email
        // 3. Update inventory
        // 4. Create fulfillment task
        
        const customerEmail = session.customer_email || session.customer_details?.email;
        const shippingAddress = (session as any).shipping_details?.address;
        const customerName = (session as any).shipping_details?.name || session.customer_details?.name;
        
        console.log('Order details:', {
          sessionId: session.id,
          paymentIntent: session.payment_intent,
          customerEmail,
          customerName,
          shippingAddress,
          amountTotal: session.amount_total,
          currency: session.currency,
        });

        // TODO: Save to database
        // await saveOrder({
        //   sessionId: session.id,
        //   customerEmail,
        //   shippingAddress,
        //   amount: session.amount_total,
        //   status: 'paid'
        // });

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('💰 PaymentIntent was successful:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('❌ Payment failed:', paymentIntent.id);
        
        // TODO: Handle failed payment
        // - Send notification to customer
        // - Update order status
        
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💸 Refund processed:', charge.id);
        
        // TODO: Handle refund
        // - Update order status
        // - Send refund confirmation
        
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}