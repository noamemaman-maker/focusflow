import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      // Create profile if missing
      if (!existingProfile) {
        await supabase.from("profiles").insert({
          user_id: data.user.id,
          email: data.user.email,
          is_premium: false,
        });
      }
    }
  }

  // IMPORTANT: Redirect user after login
  return NextResponse.redirect(`${requestUrl.origin}/timer`);
}
