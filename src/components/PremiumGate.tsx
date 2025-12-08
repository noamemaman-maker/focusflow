"use client";

import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface PremiumGateProps {
  children: React.ReactNode;
  isPremium: boolean;
  featureName?: string;
  blur?: boolean;
}

export function PremiumGate({ children, isPremium, featureName = "This feature", blur = true }: PremiumGateProps) {
  const router = useRouter();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {blur && (
        <div className="pointer-events-none select-none blur-sm opacity-50">
          {children}
        </div>
      )}
      <div className={`${blur ? "absolute inset-0" : ""} flex items-center justify-center`}>
        <Card className="w-full max-w-md mx-4 bg-background/95 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Premium Feature
            </CardTitle>
            <CardDescription>
              {featureName} is available exclusively for Premium members.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to unlock advanced focus modes, detailed analytics, AI-powered insights, and more.
            </p>
            <Button onClick={() => router.push("/billing")} className="w-full">
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
