import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  console.log("📥 Next.js webhook received");
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("❌ No stripe-signature header");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log("✅ Event verified - Type:", event.type, "Event ID:", event.id);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const subscriptionId = typeof session.subscription === "string" 
          ? session.subscription 
          : (session.subscription as Stripe.Subscription)?.id;

        console.log("Checkout completed - User ID:", userId, "Subscription ID:", subscriptionId);

        if (userId) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              is_premium: true,
              stripe_subscription_id: subscriptionId || null,
            })
            .eq("user_id", userId);

          if (error) {
            console.error("❌ Database update error:", error);
          } else {
            console.log("✅ Premium activated for user", userId);
          }
        } else {
          console.error("❌ No user_id in session metadata");
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" 
          ? subscription.customer 
          : (subscription.customer as Stripe.Customer)?.id;
        const subscriptionId = subscription.id;
        const isActive = subscription.status === "active" || subscription.status === "trialing";

        console.log("Subscription updated - Customer ID:", customerId, "Subscription ID:", subscriptionId, "Status:", subscription.status);

        if (customerId) {
          const { data: profile, error: fetchError } = await supabaseAdmin
            .from("profiles")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (fetchError) {
            console.error("❌ Error fetching profile:", fetchError);
          } else if (profile) {
            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update({
                is_premium: isActive,
                stripe_subscription_id: subscriptionId,
              })
              .eq("user_id", profile.user_id);

            if (updateError) {
              console.error("❌ Error updating profile:", updateError);
            } else {
              console.log("✅ Subscription updated for user", profile.user_id);
            }
          }
        }
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.paid":
      case "invoice_payment.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" 
          ? invoice.customer 
          : (invoice.customer as Stripe.Customer)?.id;
        const subscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : (invoice.subscription as Stripe.Subscription)?.id;

        console.log("Invoice paid - Customer ID:", customerId, "Subscription ID:", subscriptionId);

        if (customerId) {
          const { data: profile, error: fetchError } = await supabaseAdmin
            .from("profiles")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (fetchError) {
            console.error("❌ Error fetching profile:", fetchError);
          } else if (profile) {
            const updateData: any = { is_premium: true };
            if (subscriptionId) {
              updateData.stripe_subscription_id = subscriptionId;
            }

            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update(updateData)
              .eq("user_id", profile.user_id);

            if (updateError) {
              console.error("❌ Error updating profile:", updateError);
            } else {
              console.log("🔄 Invoice paid — premium activated for user", profile.user_id);
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" 
          ? subscription.customer 
          : (subscription.customer as Stripe.Customer)?.id;

        console.log("Subscription deleted - Customer ID:", customerId);

        if (customerId) {
          const { data: profile, error: fetchError } = await supabaseAdmin
            .from("profiles")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (fetchError) {
            console.error("❌ Error fetching profile:", fetchError);
          } else if (profile) {
            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update({
                is_premium: false,
                stripe_subscription_id: null,
              })
              .eq("user_id", profile.user_id);

            if (updateError) {
              console.error("❌ Error updating profile:", updateError);
            } else {
              console.log("❌ Subscription cancelled — premium removed for user", profile.user_id);
            }
          }
        }
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
