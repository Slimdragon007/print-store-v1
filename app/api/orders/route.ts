import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'payment_intent']
    });

    return NextResponse.json({
      id: session.id,
      amount: session.amount_total,
      status: session.payment_status,
      customerEmail: session.customer_email || session.customer_details?.email,
      shippingAddress: (session as any).shipping_details?.address,
      lineItems: session.line_items?.data
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
}