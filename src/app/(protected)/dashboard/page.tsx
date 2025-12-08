"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, Target, Flame } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumGate } from "@/components/PremiumGate";
import { createClient } from "@/lib/supabase/client";
import { formatMinutes } from "@/lib/utils";

interface DashboardData {
  todayWorkMinutes: number;
  weekWorkMinutes: number;
  todayBreakMinutes: number;
  weekBreakMinutes: number;
  todayCycles: number;
  weekCycles: number;
  focusScore: number;
  streak: number;
  weeklyData: { day: string; minutes: number }[];
  workBreakRatio: { name: string; value: number; color: string }[];
}

export default function DashboardPage() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("user_id", user.id)
        .single();

      setIsPremium(profile?.is_premium ?? false);

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: allSessions } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startOfWeek)
        .order("created_at", { ascending: true });

      if (!allSessions) {
        setLoading(false);
        return;
      }

      const todaySessions = allSessions.filter(s => s.created_at >= startOfDay);
      const todayWork = todaySessions.filter(s => s.session_type === "work");
      const todayBreaks = todaySessions.filter(s => s.session_type !== "work");
      const weekWork = allSessions.filter(s => s.session_type === "work");
      const weekBreaks = allSessions.filter(s => s.session_type !== "work");

      const todayWorkMinutes = todayWork.reduce((acc, s) => acc + Math.round(s.duration_seconds / 60), 0);
      const weekWorkMinutes = weekWork.reduce((acc, s) => acc + Math.round(s.duration_seconds / 60), 0);
      const todayBreakMinutes = todayBreaks.reduce((acc, s) => acc + Math.round(s.duration_seconds / 60), 0);
      const weekBreakMinutes = weekBreaks.reduce((acc, s) => acc + Math.round(s.duration_seconds / 60), 0);

      const focusScore = weekWorkMinutes + weekBreakMinutes > 0
        ? Math.round((weekWorkMinutes / (weekWorkMinutes + weekBreakMinutes)) * 100)
        : 0;

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
        const daySessions = allSessions.filter(s => 
          s.created_at >= dayStart && s.created_at < dayEnd && s.session_type === "work"
        );
        const minutes = daySessions.reduce((acc, s) => acc + Math.round(s.duration_seconds / 60), 0);
        weeklyData.push({ day: days[date.getDay()], minutes });
      }

      const workBreakRatio = [
        { name: "Work", value: weekWorkMinutes, color: "hsl(var(--primary))" },
        { name: "Break", value: weekBreakMinutes, color: "#22c55e" },
      ];

      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
        
        const { data: daySessions } = await supabase
          .from("sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("session_type", "work")
          .gte("created_at", dayStart)
          .lt("created_at", dayEnd)
          .limit(1);

        if (daySessions && daySessions.length > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      setData({
        todayWorkMinutes,
        weekWorkMinutes,
        todayBreakMinutes,
        weekBreakMinutes,
        todayCycles: todayWork.length,
        weekCycles: weekWork.length,
        focusScore,
        streak,
        weeklyData,
        workBreakRatio,
      });
      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  const dashboardContent = (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Focus</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMinutes(data?.todayWorkMinutes || 0)}</div>
            <p className="text-xs text-muted-foreground">{data?.todayCycles || 0} sessions completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMinutes(data?.weekWorkMinutes || 0)}</div>
            <p className="text-xs text-muted-foreground">{data?.weekCycles || 0} total sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.focusScore || 0}%</div>
            <p className="text-xs text-muted-foreground">Work vs break ratio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.streak || 0} days</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Focus Time</CardTitle>
            <CardDescription>Minutes of focused work per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work vs Break Ratio</CardTitle>
            <CardDescription>Time distribution this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.workBreakRatio || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}m`}
                >
                  {(data?.workBreakRatio || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Break Time Summary</CardTitle>
          <CardDescription>Your rest patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-green-600">{formatMinutes(data?.todayBreakMinutes || 0)}</p>
              <p className="text-sm text-muted-foreground">Today&apos;s Break Time</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-green-600">{formatMinutes(data?.weekBreakMinutes || 0)}</p>
              <p className="text-sm text-muted-foreground">This Week&apos;s Break Time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-8">Productivity Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8">Productivity Dashboard</h1>
      <PremiumGate isPremium={isPremium} featureName="The Productivity Dashboard">
        {dashboardContent}
      </PremiumGate>
    </div>
  );
}
