export type FocusMode = "pomodoro" | "deep" | "52-17" | "ultradian";

export type SessionType = "work" | "short_break" | "long_break";

export interface TimerConfig {
  workDuration: number;
  breakDuration: number;
  longBreakDuration?: number;
  label: string;
  isPremium: boolean;
}

export interface Session {
  id: string;
  user_id: string;
  session_type: SessionType;
  mode: FocusMode;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  is_premium: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIInsight {
  id: string;
  user_id: string;
  insight_text: string;
  generated_at: string;
}

export const TIMER_CONFIGS: Record<FocusMode, TimerConfig> = {
  pomodoro: {
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    label: "Pomodoro",
    isPremium: false,
  },
  deep: {
    workDuration: 50 * 60,
    breakDuration: 10 * 60,
    label: "Deep Work",
    isPremium: true,
  },
  "52-17": {
    workDuration: 52 * 60,
    breakDuration: 17 * 60,
    label: "52/17",
    isPremium: true,
  },
  ultradian: {
    workDuration: 90 * 60,
    breakDuration: 20 * 60,
    label: "Ultradian",
    isPremium: true,
  },
};
