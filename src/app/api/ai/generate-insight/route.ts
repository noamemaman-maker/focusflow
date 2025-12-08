import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_premium) {
      return NextResponse.json({ error: "Premium required" }, { status: 403 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: true });

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        insight: "## No Data Yet\n\nYou haven't logged any focus sessions in the past 7 days. Start using the timer to track your productivity and get personalized insights!",
      });
    }

    const workSessions = sessions.filter(s => s.session_type === "work");
    const breakSessions = sessions.filter(s => s.session_type !== "work");
    
    const totalWorkMinutes = workSessions.reduce((acc, s) => acc + Math.round(s.duration_seconds / 60), 0);
    const totalBreakMinutes = breakSessions.reduce((acc, s) => acc + Math.round(s.duration_seconds / 60), 0);
    
    const modeBreakdown = workSessions.reduce((acc: Record<string, number>, s) => {
      acc[s.mode] = (acc[s.mode] || 0) + 1;
      return acc;
    }, {});

    const dailyStats: Record<string, { work: number; sessions: number }> = {};
    sessions.forEach(s => {
      const day = new Date(s.created_at).toLocaleDateString("en-US", { weekday: "long" });
      if (!dailyStats[day]) {
        dailyStats[day] = { work: 0, sessions: 0 };
      }
      if (s.session_type === "work") {
        dailyStats[day].work += Math.round(s.duration_seconds / 60);
        dailyStats[day].sessions += 1;
      }
    });

    const summaryData = {
      totalWorkMinutes,
      totalBreakMinutes,
      totalSessions: workSessions.length,
      focusScore: totalWorkMinutes + totalBreakMinutes > 0 
        ? Math.round((totalWorkMinutes / (totalWorkMinutes + totalBreakMinutes)) * 100) 
        : 0,
      modeBreakdown,
      dailyStats,
      averageSessionLength: workSessions.length > 0 
        ? Math.round(totalWorkMinutes / workSessions.length) 
        : 0,
    };

    const systemPrompt = `You are a productivity coach analyzing a user's focus session data from the past 7 days. 
Provide personalized, actionable insights in a supportive and encouraging tone.
Format your response in Markdown with these sections:
- ## Overview (brief summary of their week)
- ## Strengths (what they're doing well)
- ## Opportunities to Improve (constructive feedback)
- ## Recommendations (3-5 specific, actionable tips)

Be specific and reference their actual data. Keep the response concise but valuable.`;

    const userPrompt = `Here's my productivity data for the past 7 days:

Total Work Time: ${summaryData.totalWorkMinutes} minutes
Total Break Time: ${summaryData.totalBreakMinutes} minutes
Total Focus Sessions: ${summaryData.totalSessions}
Focus Score: ${summaryData.focusScore}%
Average Session Length: ${summaryData.averageSessionLength} minutes

Focus Modes Used:
${Object.entries(summaryData.modeBreakdown).map(([mode, count]) => `- ${mode}: ${count} sessions`).join("\n")}

Daily Breakdown:
${Object.entries(summaryData.dailyStats).map(([day, stats]) => `- ${day}: ${stats.work} minutes, ${stats.sessions} sessions`).join("\n")}

Please analyze my productivity patterns and provide personalized insights.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const insight = completion.choices[0]?.message?.content || "Unable to generate insight";

    await supabase.from("ai_insights").insert({
      user_id: user.id,
      insight_text: insight,
    });

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("AI insight error:", error);
    return NextResponse.json(
      { error: "Failed to generate insight" },
      { status: 500 }
    );
  }
}
