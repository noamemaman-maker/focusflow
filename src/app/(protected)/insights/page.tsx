"use client";

import { useState, useEffect } from "react";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumGate } from "@/components/PremiumGate";
import { createClient } from "@/lib/supabase/client";

export default function InsightsPage() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function checkPremium() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("user_id", user.id)
        .single();

      setIsPremium(profile?.is_premium ?? false);

      const { data: lastInsight } = await supabase
        .from("ai_insights")
        .select("insight_text, generated_at")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (lastInsight) {
        setInsight(lastInsight.insight_text);
      }

      setLoading(false);
    }

    checkPremium();
  }, [supabase]);

  const generateInsight = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-insight", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate insight");
      }

      const data = await response.json();
      setInsight(data.insight);
    } catch (err) {
      setError("Failed to generate insight. Please try again.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const insightsContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>AI Productivity Analysis</CardTitle>
          <CardDescription>
            Get personalized insights based on your last 7 days of productivity data
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={generateInsight} 
            disabled={generating}
            size="lg"
            className="w-full max-w-xs"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate My AI Productivity Insight
              </>
            )}
          </Button>
          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>

      {insight && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Your Productivity Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: formatMarkdown(insight) }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-8">AI Productivity Insights</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8">AI Productivity Insights</h1>
      <PremiumGate isPremium={isPremium} featureName="AI Insights" blur={false}>
        {insightsContent}
      </PremiumGate>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/\n/g, '<br />');
}
