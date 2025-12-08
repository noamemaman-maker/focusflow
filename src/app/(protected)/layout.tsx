import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("user_id", user.id)
    .single();

  const isPremium = profile?.is_premium ?? false;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={{ email: user.email || "" }} isPremium={isPremium} />
      <main className="flex-1 container mx-auto py-6">
        {children}
      </main>
    </div>
  );
}
