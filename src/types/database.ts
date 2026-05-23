// src/types/database.ts

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  banner_url: string | null;
  questions_per_quiz: number;
  time_limit: string;
  leaderboard_public: boolean;
  show_winner: boolean;
  qr_code_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  campaign_id: string | null;
  text: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  options: string[];        // array of answer strings
  correct_index: number;    // 0-based
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  campaign_id: string | null;
  participant_name: string | null;
  participant_email: string | null;
  score: number;
  total: number;
  completed_at: string;
}

export interface LeaderboardEntry {
  id: string;
  campaign_id: string;
  campaign_name: string;
  participant_name: string | null;
  participant_email: string | null;
  score: number;
  total: number;
  percentage: number;
  completed_at: string;
  rank: number;
}

export interface ActivityLog {
  id: string;
  type: "campaign_created" | "question_uploaded" | "winner_announced" | "quiz_completed";
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Supabase DB shape for createClient generic
export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Campaign, "id" | "created_at" | "updated_at">>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Question, "id" | "created_at" | "updated_at">>;
      };
      quiz_attempts: {
        Row: QuizAttempt;
        Insert: Omit<QuizAttempt, "id">;
        Update: Partial<Omit<QuizAttempt, "id">>;
      };
      activity_log: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, "id" | "created_at">;
        Update: Partial<Omit<ActivityLog, "id" | "created_at">>;
      };
    };
    Views: {
      leaderboard: {
        Row: LeaderboardEntry;
      };
    };
  };
}