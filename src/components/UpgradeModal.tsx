"use client";

import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
}

export function UpgradeModal({ open, onOpenChange, featureName }: UpgradeModalProps) {
  const router = useRouter();

  const premiumFeatures = [
    "Deep Work Mode (50/10)",
    "52/17 Focus Mode",
    "Ultradian Cycle (90/20)",
    "Advanced Analytics Dashboard",
    "AI Productivity Insights",
    "Unlimited Session History",
    "Productivity Streak Tracking",
  ];

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push("/billing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Premium Feature
          </DialogTitle>
          <DialogDescription>
            {featureName ? `${featureName} is a` : "This is a"} premium feature. Upgrade to unlock all advanced capabilities.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <h4 className="text-sm font-medium mb-3">Premium includes:</h4>
          <ul className="space-y-2">
            {premiumFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade}>
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
