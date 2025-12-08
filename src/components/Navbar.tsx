"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Timer, LayoutDashboard, Lightbulb, History, Settings, CreditCard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavbarProps {
  user: { email: string } | null;
  isPremium: boolean;
}

export function Navbar({ user, isPremium }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { href: "/timer", label: "Timer", icon: Timer },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, premium: true },
    { href: "/insights", label: "AI Insights", icon: Lightbulb, premium: true },
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Timer className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">FocusFlow</span>
          </Link>
        </div>

        {user && (
          <>
            <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
              <nav className="flex items-center space-x-6 text-sm font-medium">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 transition-colors hover:text-foreground/80",
                      pathname === item.href ? "text-foreground" : "text-foreground/60"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.premium && !isPremium && (
                      <Badge variant="outline" className="ml-1 text-xs">PRO</Badge>
                    )}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-4">
                {isPremium && <Badge variant="premium">PREMIUM</Badge>}
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end md:hidden">
              {isPremium && <Badge variant="premium" className="mr-2">PRO</Badge>}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </>
        )}

        {!user && (
          <div className="flex flex-1 items-center justify-end space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        )}
      </div>

      {mobileMenuOpen && user && (
        <div className="border-t md:hidden">
          <div className="container py-4">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/60 hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.premium && !isPremium && (
                    <Badge variant="outline" className="ml-auto text-xs">PRO</Badge>
                  )}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/60 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
}
