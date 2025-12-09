"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Badge } from "@/components/ui/badge";
import { formatTime, cn } from "@/lib/utils";
import { FocusMode, SessionType, TIMER_CONFIGS } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useSoundAlert } from "@/hooks/useSoundAlert";

interface TimerProps {
  userId: string;
  isPremium: boolean;
}

const STORAGE_KEY = "focusflow_timer_state";

interface TimerState {
  mode: FocusMode;
  secondsLeft: number;
  running: boolean;
  currentSessionType: SessionType;
  startTime: string | null;
  completedCycles: number;
}

export function Timer({ userId, isPremium }: TimerProps) {
  const [mode, setMode] = useState<FocusMode>("pomodoro");
  const [secondsLeft, setSecondsLeft] = useState(TIMER_CONFIGS.pomodoro.workDuration);
  const [running, setRunning] = useState(false);
  const [currentSessionType, setCurrentSessionType] = useState<SessionType>("work");
  const [startTime, setStartTime] = useState<string | null>(null);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPremiumMode, setSelectedPremiumMode] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const playSound = useSoundAlert();
  const supabase = createClient();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state: TimerState = JSON.parse(saved);
        if (!TIMER_CONFIGS[state.mode].isPremium || isPremium) {
          setMode(state.mode);
          setSecondsLeft(state.secondsLeft);
          setCurrentSessionType(state.currentSessionType);
          setStartTime(state.startTime);
          setCompletedCycles(state.completedCycles);
        }
      } catch (e) {
        console.error("Failed to restore timer state:", e);
      }
    }
  }, [isPremium]);

  useEffect(() => {
    const state: TimerState = {
      mode,
      secondsLeft,
      running: false,
      currentSessionType,
      startTime,
      completedCycles,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [mode, secondsLeft, currentSessionType, startTime, completedCycles]);

  const logSession = useCallback(async (sessionType: SessionType, sessionMode: FocusMode, start: string, end: string, duration: number) => {
    try {
      await supabase.from("sessions").insert({
        user_id: userId,
        session_type: sessionType,
        mode: sessionMode,
        start_time: start,
        end_time: end,
        duration_seconds: duration,
      });
    } catch (error) {
      console.error("Failed to log session:", error);
    }
  }, [supabase, userId]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const showNotification = useCallback((title: string, body: string) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          const notification = new Notification(title, {
            body,
          });
          console.log("Notification sent:", title);
        } catch (error) {
          console.error("Failed to show notification:", error);
        }
      } else {
        console.log("Notification permission not granted:", Notification.permission);
      }
    }
  }, []);

  const handlePlaySound = useCallback(() => {
    if (soundEnabled) {
      if (currentSessionType === "work") {
        // Work session ended - play success bell (time for break)
        playSound("/sounds/success-bell.mp3");
        showNotification("Break Time! 🎉", "Great work! Time to take a well-deserved break.");
      } else {
        // Break ended - play begin work bell (time to start working)
        playSound("/sounds/begin-work-bell.mp3");
        showNotification("Back to Work! 💪", "Break's over. Let's get focused!");
      }
    } else {
      // Show notifications even if sound is disabled
      if (currentSessionType === "work") {
        showNotification("Break Time! 🎉", "Great work! Time to take a well-deserved break.");
      } else {
        showNotification("Back to Work! 💪", "Break's over. Let's get focused!");
      }
    }
  }, [soundEnabled, currentSessionType, playSound, showNotification]);

  const handleSessionComplete = useCallback(async () => {
    handlePlaySound();
    const endTime = new Date().toISOString();
    const config = TIMER_CONFIGS[mode];
    
    if (startTime) {
      const duration = currentSessionType === "work" 
        ? config.workDuration 
        : currentSessionType === "long_break" 
          ? (config.longBreakDuration || config.breakDuration)
          : config.breakDuration;
      
      await logSession(currentSessionType, mode, startTime, endTime, duration);
    }

    if (currentSessionType === "work") {
      const newCycles = completedCycles + 1;
      setCompletedCycles(newCycles);
      
      if (mode === "pomodoro" && newCycles % 4 === 0 && config.longBreakDuration) {
        setCurrentSessionType("long_break");
        setSecondsLeft(config.longBreakDuration);
      } else {
        setCurrentSessionType("short_break");
        setSecondsLeft(config.breakDuration);
      }
    } else {
      setCurrentSessionType("work");
      setSecondsLeft(config.workDuration);
    }
    
    setStartTime(new Date().toISOString());
    setRunning(false);
  }, [mode, currentSessionType, startTime, completedCycles, logSession, handlePlaySound]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (running && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (running && secondsLeft === 0) {
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [running, secondsLeft, handleSessionComplete]);

  const handleModeChange = (newMode: FocusMode) => {
    const config = TIMER_CONFIGS[newMode];
    
    if (config.isPremium && !isPremium) {
      setSelectedPremiumMode(config.label);
      setShowUpgradeModal(true);
      return;
    }

    setMode(newMode);
    setSecondsLeft(config.workDuration);
    setCurrentSessionType("work");
    setRunning(false);
    setStartTime(null);
    setCompletedCycles(0);
  };

  const handleStart = () => {
    if (!running && !startTime) {
      setStartTime(new Date().toISOString());
    }
    setRunning(true);
  };

  const handlePause = () => {
    setRunning(false);
  };

  const handleReset = () => {
    const config = TIMER_CONFIGS[mode];
    setSecondsLeft(currentSessionType === "work" 
      ? config.workDuration 
      : currentSessionType === "long_break" 
        ? (config.longBreakDuration || config.breakDuration) 
        : config.breakDuration
    );
    setRunning(false);
    setStartTime(null);
  };

  const config = TIMER_CONFIGS[mode];
  const totalDuration = currentSessionType === "work" 
    ? config.workDuration 
    : currentSessionType === "long_break" 
      ? (config.longBreakDuration || config.breakDuration) 
      : config.breakDuration;
  const progress = ((totalDuration - secondsLeft) / totalDuration) * 100;

  const sessionLabel = currentSessionType === "work" 
    ? "Focus Time" 
    : currentSessionType === "long_break" 
      ? "Long Break" 
      : "Break Time";

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4">
      <Tabs value={mode} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {(Object.keys(TIMER_CONFIGS) as FocusMode[]).map((m) => (
            <TabsTrigger
              key={m}
              value={m}
              onClick={() => handleModeChange(m)}
              className={cn(
                "relative text-xs sm:text-sm",
                TIMER_CONFIGS[m].isPremium && !isPremium && "opacity-60"
              )}
            >
              {TIMER_CONFIGS[m].label}
              {TIMER_CONFIGS[m].isPremium && !isPremium && (
                <Badge variant="outline" className="absolute -top-2 -right-2 text-[10px] px-1">
                  PRO
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <p className={cn(
                "text-sm font-medium mb-2",
                currentSessionType === "work" ? "text-primary" : "text-green-600"
              )}>
                {sessionLabel}
              </p>
              <div className="text-7xl sm:text-8xl font-bold tabular-nums">
                {formatTime(secondsLeft)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Cycles completed: {completedCycles}
              </p>
            </div>

            <Progress value={progress} className="w-full h-2" />

            <div className="flex items-center gap-4">
              {!running ? (
                <Button size="lg" onClick={handleStart} className="w-28">
                  <Play className="h-5 w-5 mr-2" />
                  Start
                </Button>
              ) : (
                <Button size="lg" onClick={handlePause} variant="secondary" className="w-28">
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="ghost" 
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>{config.label} Mode</p>
        <p>
          Work: {config.workDuration / 60}min | Break: {config.breakDuration / 60}min
          {config.longBreakDuration && ` | Long Break: ${config.longBreakDuration / 60}min`}
        </p>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        featureName={selectedPremiumMode}
      />
    </div>
  );
}
