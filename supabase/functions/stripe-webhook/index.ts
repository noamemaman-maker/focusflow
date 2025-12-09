import Stripe from "npm:stripe@12";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  Deno.env.get("PROJECT_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  console.log("📥 Webhook request received");

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error("❌ No stripe-signature header found");
    return new Response("No signature", { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
    console.log("✅ Event verified - Type:", event.type, "Event ID:", event.id);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Webhook signature verification failed:", errorMessage);
    return new Response(`Invalid signature: ${errorMessage}`, { status: 400 });
  }

  try {
    // ---------------------------------------------------------------
    // 1️⃣ Handle checkout.session.completed
    // ---------------------------------------------------------------
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription as Stripe.Subscription)?.id;

      console.log("🛒 Checkout completed");
      console.log("  - User ID from metadata:", userId || "MISSING");
      console.log("  - Subscription ID:", subscriptionId || "MISSING");

      if (!userId) {
        console.warn("⚠️ No user_id in session metadata, skipping update");
        return new Response("OK - No user_id in metadata", { status: 200 });
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          is_premium: true,
          stripe_subscription_id: subscriptionId || null,
        })
        .eq("user_id", userId);

      if (error) {
        console.error("❌ Database update error:", error);
        return new Response(`Database error: ${error.message}`, { status: 500 });
      }

      console.log("✅ Premium activated for user:", userId);
      return new Response("OK", { status: 200 });
    }

    // ---------------------------------------------------------------
    // 2️⃣ Handle invoice.payment_succeeded (for renewals and initial payments)
    // ---------------------------------------------------------------
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string"
        ? invoice.customer
        : (invoice.customer as Stripe.Customer)?.id;
      const subscriptionId = typeof invoice.subscription === "string"
        ? invoice.subscription
        : (invoice.subscription as Stripe.Subscription)?.id;

      console.log("💳 Invoice payment succeeded");
      console.log("  - Customer ID:", customerId || "MISSING");
      console.log("  - Subscription ID:", subscriptionId || "MISSING");

      if (!customerId) {
        console.warn("⚠️ No customer ID in invoice, skipping update");
        return new Response("OK - No customer ID", { status: 200 });
      }

      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("user_id, stripe_subscription_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (fetchError) {
        console.error("❌ Error fetching profile:", fetchError);
        return new Response(`Database fetch error: ${fetchError.message}`, { status: 500 });
      }

      if (!profile) {
        console.warn("⚠️ No profile found for customer ID:", customerId);
        return new Response("OK - Profile not found", { status: 200 });
      }

      const updateData: { is_premium: boolean; stripe_subscription_id?: string | null } = {
        is_premium: true,
      };

      if (subscriptionId) {
        updateData.stripe_subscription_id = subscriptionId;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", profile.user_id);

      if (updateError) {
        console.error("❌ Database update error:", updateError);
        return new Response(`Database update error: ${updateError.message}`, { status: 500 });
      }

      console.log("✅ Premium activated/renewed for user:", profile.user_id);
      return new Response("OK", { status: 200 });
    }

    // ---------------------------------------------------------------
    // 3️⃣ Handle customer.subscription.deleted (cancellation)
    // ---------------------------------------------------------------
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      console.log("🗑️ Subscription deleted");
      console.log("  - Subscription ID:", subscriptionId);

      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (fetchError) {
        console.error("❌ Error fetching profile:", fetchError);
        return new Response(`Database fetch error: ${fetchError.message}`, { status: 500 });
      }

      if (!profile) {
        console.warn("⚠️ No profile found for subscription ID:", subscriptionId);
        return new Response("OK - Profile not found", { status: 200 });
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_premium: false,
        })
        .eq("user_id", profile.user_id);

      if (updateError) {
        console.error("❌ Database update error:", updateError);
        return new Response(`Database update error: ${updateError.message}`, { status: 500 });
      }

      console.log("✅ Premium deactivated for user:", profile.user_id);
      return new Response("OK", { status: 200 });
    }

    // ---------------------------------------------------------------
    // 4️⃣ Unhandled event types (log but return OK)
    // ---------------------------------------------------------------
    console.log("ℹ️ Unhandled event type:", event.type);
    return new Response("OK - Event type not handled", { status: 200 });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Webhook processing error:", errorMessage);
    console.error("Error details:", err);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 500 });
  }
});
