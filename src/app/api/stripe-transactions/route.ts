import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY not configured", transactions: [] },
      { status: 200 }
    );
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });

    // Fetch last 50 successful charges
    const charges = await stripe.charges.list({
      limit: 50,
      expand: ["data.customer"],
    });

    // Fetch active subscriptions for recurring detection
    const subscriptions = await stripe.subscriptions.list({
      limit: 50,
      status: "active",
    });

    const subCustomerIds = new Set(
      subscriptions.data.map((s) => s.customer as string)
    );

    const transactions = charges.data
      .filter((c) => c.status === "succeeded")
      .map((c) => ({
        id: c.id,
        amount: c.amount / 100,
        date: new Date(c.created * 1000).toISOString().split("T")[0],
        status: c.status as "succeeded",
        donorEmail: c.billing_details?.email || "",
        description: c.description || "Donation",
        recurring: typeof c.customer === "string" && subCustomerIds.has(c.customer),
      }));

    return NextResponse.json({
      transactions,
      subscriptionCount: subscriptions.data.length,
      monthlyRecurring: subscriptions.data.reduce(
        (sum, s) => sum + (s.items.data[0]?.price?.unit_amount || 0) / 100,
        0
      ),
    });
  } catch (err) {
    console.error("Stripe fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Stripe data", transactions: [] },
      { status: 200 }
    );
  }
}
