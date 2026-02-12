export type LogType = "presence" | "builder" | "health" | "mind" | "wealth";

export interface Memory {
  id: string;
  content: string;
  category: "identity" | "preference" | "history" | "other";
  addedAt: string; // ISO Date
}

export interface User {
  id: string;
  email: string;
  name: string;
  token?: string;
}

export interface DailyLog {
  date: string; // ISO YYYY-MM-DD
  mood: number; // 1-5
  energy: number; // 1-5
  deepWorkMinutes: number;
  reps: {
    presence: boolean;
    build: boolean;
    workout: boolean;
  };
  reflection: {
    win: string;
    lesson: string;
    priority: string;
  };
  habitsCompleted: string[]; // Array of Habit IDs
}

export interface Habit {
  id: string;
  name: string;
  category: LogType;
  active: boolean;
}

export interface Objective {
  id: string;
  year: number;
  theme: LogType;
  title: string;
  why: string;
  active: boolean;
  keyResults: KeyResult[];
}

export interface KeyResult {
  id: string;
  title: string;
  target: string;
  current: string;
  confidence: number; // 1-5
}

export interface WeeklyReview {
  id: string;
  weekStartDate: string; // ISO
  wins: string;
  misses: string;
  learnings: string;
  adjustment: string;
}

export interface AppState {
  user: User | null; // Replaces isAuthenticated boolean
  theme: "light" | "dark";
  logs: DailyLog[];
  habits: Habit[];
  objectives: Objective[];
  reviews: WeeklyReview[];
  unlockedVisualizations: string[]; // IDs of unlocked viz
  systemPrompt: string; // Custom instructions for the AI
  memories: Memory[]; // Long-term facts about the user
}

export type View =
  | "dashboard"
  | "checkin"
  | "habits"
  | "okrs"
  | "review"
  | "insights"
  | "settings";
