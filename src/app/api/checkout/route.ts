import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const { amount, recurring } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Invalid donation amount" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    if (recurring) {
      // Create a subscription checkout session
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              recurring: { interval: "month" },
              product_data: {
                name: "Monthly Donation to Donkey Dreams Sanctuary",
                description: `$${amount}/month recurring donation`,
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}?donation=success`,
        cancel_url: `${origin}?donation=cancelled`,
      });

      return NextResponse.json({ url: session.url });
    } else {
      // Create a one-time payment checkout session
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Donation to Donkey Dreams Sanctuary",
                description: `One-time $${amount} donation`,
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}?donation=success`,
        cancel_url: `${origin}?donation=cancelled`,
      });

      return NextResponse.json({ url: session.url });
    }
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
