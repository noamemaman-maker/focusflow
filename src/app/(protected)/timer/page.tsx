import { createClient } from "@/lib/supabase/server";
import { Timer } from "@/components/Timer";
import { redirect } from "next/navigation";

export default async function TimerPage() {
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

  const { data: todaySessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("session_type", "work")
    .gte("created_at", new Date().toISOString().split("T")[0])
    .order("created_at", { ascending: false });

  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(7);

  const todayWorkMinutes = todaySessions?.reduce((acc, session) => acc + Math.round(session.duration_seconds / 60), 0) || 0;
  const todayCycles = todaySessions?.length || 0;

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Focus Timer</h1>
        <p className="text-muted-foreground">Choose your focus mode and start your session</p>
      </div>

      <Timer userId={user.id} isPremium={isPremium} />

      <div className="mt-12 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">Today&apos;s Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4 text-center border">
            <p className="text-3xl font-bold text-primary">{todayWorkMinutes}</p>
            <p className="text-sm text-muted-foreground">Minutes Focused</p>
          </div>
          <div className="bg-card rounded-lg p-4 text-center border">
            <p className="text-3xl font-bold text-primary">{todayCycles}</p>
            <p className="text-sm text-muted-foreground">Sessions Completed</p>
          </div>
        </div>

        {recentSessions && recentSessions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-3">Recent Sessions</h3>
            <div className="space-y-2">
              {recentSessions.slice(0, 5).map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${session.session_type === "work" ? "bg-primary" : "bg-green-500"}`} />
                    <span className="capitalize">{session.session_type.replace("_", " ")}</span>
                    <span className="text-muted-foreground">({session.mode})</span>
                  </div>
                  <span className="text-muted-foreground">
                    {Math.round(session.duration_seconds / 60)} min
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
