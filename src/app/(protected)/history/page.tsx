"use client";

import { useEffect, useState } from "react";
import { Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Session } from "@/types";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSessions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("user_id", user.id)
        .single();

      setIsPremium(profile?.is_premium ?? false);

      const limit = profile?.is_premium ? 100 : 7;

      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      setSessions(data || []);
      setLoading(false);
    }

    fetchSessions();
  }, [supabase]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case "work":
        return "bg-primary text-primary-foreground";
      case "short_break":
        return "bg-green-500 text-white";
      case "long_break":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "pomodoro":
        return "Pomodoro";
      case "deep":
        return "Deep Work";
      case "52-17":
        return "52/17";
      case "ultradian":
        return "Ultradian";
      default:
        return mode;
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-8">Session History</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Session History</h1>
          <p className="text-muted-foreground mt-1">
            {isPremium ? "Your complete session history" : "Last 7 sessions (upgrade for full history)"}
          </p>
        </div>
        {!isPremium && (
          <Badge variant="outline">Free: 7 sessions</Badge>
        )}
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
            <p className="text-muted-foreground">
              Complete your first focus session to see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${session.session_type === "work" ? "bg-primary" : "bg-green-500"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {session.session_type.replace("_", " ")}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getModeLabel(session.mode)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(session.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {Math.round(session.duration_seconds / 60)} min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
