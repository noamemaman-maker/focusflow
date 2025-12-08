import Link from "next/link";
import { Timer, BarChart3, Brain, Zap, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

async function checkUser() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  const user = await checkUser();

  if (user) {
    redirect("/timer");
  }

  const features = [
    {
      icon: Timer,
      title: "Smart Timer Modes",
      description: "Choose from Pomodoro, Deep Work, 52/17, or Ultradian cycles to match your work style.",
    },
    {
      icon: BarChart3,
      title: "Productivity Dashboard",
      description: "Track your focus time, break patterns, and productivity streaks with beautiful charts.",
    },
    {
      icon: Brain,
      title: "AI Insights",
      description: "Get personalized productivity recommendations powered by AI analysis of your work patterns.",
    },
    {
      icon: Zap,
      title: "Focus Score",
      description: "Measure your productivity efficiency with a calculated focus score based on your sessions.",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Get started with essential features",
      features: [
        "Pomodoro Timer (25/5/15)",
        "Session Logging",
        "Basic Stats (Last 7 sessions)",
        "Email Authentication",
      ],
      cta: "Get Started",
      href: "/auth/register",
      highlighted: false,
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "/month",
      description: "Unlock your full potential",
      features: [
        "All Free features",
        "Deep Work Mode (50/10)",
        "52/17 & Ultradian Modes",
        "Advanced Analytics Dashboard",
        "AI Productivity Insights",
        "Unlimited Session History",
        "Productivity Streaks",
      ],
      cta: "Start Free Trial",
      href: "/auth/register",
      highlighted: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">FocusFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Master Your Focus,<br />
              <span className="text-primary">Boost Your Productivity</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              FocusFlow is a smart productivity timer that helps you work smarter, not harder. 
              Track your sessions, analyze your patterns, and get AI-powered insights to optimize your workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything You Need to Stay Focused
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardHeader>
                    <feature.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Start free and upgrade when you need more. No hidden fees.
            </p>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={plan.highlighted ? "border-primary shadow-lg relative" : ""}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={plan.href}>
                      <Button 
                        className="w-full" 
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FocusFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
