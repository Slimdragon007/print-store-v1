import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { findPrint, findVariant } from "@/lib/prints";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let line_items: { price: string; quantity: number }[];

    if (Array.isArray(body.line_items)) {
      line_items = body.line_items;
    } else if (body.printId && body.variantId) {
      const p = findPrint(String(body.printId));
      if (!p) return NextResponse.json({ error: "Unknown printId" }, { status: 400 });
      const v = findVariant(p, String(body.variantId));
      if (!v) return NextResponse.json({ error: "Unknown variantId" }, { status: 400 });
      line_items = [{ price: v.stripePriceId, quantity: 1 }];
    } else {
      return NextResponse.json({ error: "Provide line_items OR (printId & variantId)" }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cart`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'FR', 'DE', 'IT', 'ES'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 500,
              currency: 'usd',
            },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 10,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1500,
              currency: 'usd',
            },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 2,
              },
              maximum: {
                unit: 'business_day',
                value: 3,
              },
            },
          },
        },
      ],
      phone_number_collection: {
        enabled: true,
      },
      customer_email: body.email || undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("checkout error", e);
    return NextResponse.json({ error: e?.message || "Checkout failed" }, { status: 400 });
  }
}