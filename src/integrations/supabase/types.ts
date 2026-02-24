export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accountability_scores: {
        Row: {
          client_id: string
          current_streak: number | null
          id: string
          level: string | null
          longest_streak: number | null
          total_points: number | null
        }
        Insert: {
          client_id: string
          current_streak?: number | null
          id?: string
          level?: string | null
          longest_streak?: number | null
          total_points?: number | null
        }
        Update: {
          client_id?: string
          current_streak?: number | null
          id?: string
          level?: string | null
          longest_streak?: number | null
          total_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "accountability_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          criteria: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          criteria?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          criteria?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      client_badges: {
        Row: {
          badge_id: string
          client_id: string
          earned_at: string | null
          id: string
        }
        Insert: {
          badge_id: string
          client_id: string
          earned_at?: string | null
          id?: string
        }
        Update: {
          badge_id?: string
          client_id?: string
          earned_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_badges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          coach_id: string
          created_at: string | null
          current_phase: string | null
          current_week: number | null
          end_date: string | null
          goal_weight: number | null
          id: string
          package_type: string | null
          primary_goal: string | null
          start_date: string | null
          start_weight: number | null
          status: Database["public"]["Enums"]["client_status"] | null
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          current_phase?: string | null
          current_week?: number | null
          end_date?: string | null
          goal_weight?: number | null
          id?: string
          package_type?: string | null
          primary_goal?: string | null
          start_date?: string | null
          start_weight?: number | null
          status?: Database["public"]["Enums"]["client_status"] | null
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          current_phase?: string | null
          current_week?: number | null
          end_date?: string | null
          goal_weight?: number | null
          id?: string
          package_type?: string | null
          primary_goal?: string | null
          start_date?: string | null
          start_weight?: number | null
          status?: Database["public"]["Enums"]["client_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_notes: {
        Row: {
          category: Database["public"]["Enums"]["note_category"] | null
          client_id: string
          content: string
          created_at: string | null
          id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["note_category"] | null
          client_id: string
          content: string
          created_at?: string | null
          id?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["note_category"] | null
          client_id?: string
          content?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_calls: {
        Row: {
          action_items: string | null
          call_type: Database["public"]["Enums"]["call_type"] | null
          client_id: string
          duration_minutes: number | null
          id: string
          scheduled_at: string | null
          session_notes: string | null
          status: Database["public"]["Enums"]["call_status"] | null
        }
        Insert: {
          action_items?: string | null
          call_type?: Database["public"]["Enums"]["call_type"] | null
          client_id: string
          duration_minutes?: number | null
          id?: string
          scheduled_at?: string | null
          session_notes?: string | null
          status?: Database["public"]["Enums"]["call_status"] | null
        }
        Update: {
          action_items?: string | null
          call_type?: Database["public"]["Enums"]["call_type"] | null
          client_id?: string
          duration_minutes?: number | null
          id?: string
          scheduled_at?: string | null
          session_notes?: string | null
          status?: Database["public"]["Enums"]["call_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_calls_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_habits: {
        Row: {
          active: boolean | null
          client_id: string
          habit_name: string
          habit_order: number | null
          id: string
        }
        Insert: {
          active?: boolean | null
          client_id: string
          habit_name: string
          habit_order?: number | null
          id?: string
        }
        Update: {
          active?: boolean | null
          client_id?: string
          habit_name?: string
          habit_order?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_habits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_checklist_items: {
        Row: {
          assigned_to: string | null
          completed: boolean | null
          deadline: string | null
          document_id: string
          id: string
          item_text: string
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean | null
          deadline?: string | null
          document_id: string
          id?: string
          item_text: string
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean | null
          deadline?: string | null
          document_id?: string
          id?: string
          item_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_checklist_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "shared_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          id: string
          instructions: string | null
          muscle_group: string | null
          name: string
          video_url: string | null
        }
        Insert: {
          id?: string
          instructions?: string | null
          muscle_group?: string | null
          name: string
          video_url?: string | null
        }
        Update: {
          id?: string
          instructions?: string | null
          muscle_group?: string | null
          name?: string
          video_url?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          client_id: string
          created_at: string | null
          current_value: number | null
          deadline: string | null
          id: string
          start_value: number | null
          status: Database["public"]["Enums"]["goal_status"] | null
          target_value: number | null
          title: string
          unit: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          current_value?: number | null
          deadline?: string | null
          id?: string
          start_value?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_value?: number | null
          title: string
          unit?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          current_value?: number | null
          deadline?: string | null
          id?: string
          start_value?: number | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_value?: number | null
          title?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          completed: boolean | null
          date: string
          habit_id: string
          id: string
        }
        Insert: {
          completed?: boolean | null
          date: string
          habit_id: string
          id?: string
        }
        Update: {
          completed?: boolean | null
          date?: string
          habit_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "daily_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          calories: number | null
          carbs_g: number | null
          description: string | null
          fat_g: number | null
          id: string
          meal_name: string
          meal_order: number
          plan_id: string
          protein_g: number | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          description?: string | null
          fat_g?: number | null
          id?: string
          meal_name: string
          meal_order?: number
          plan_id: string
          protein_g?: number | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          description?: string | null
          fat_g?: number | null
          id?: string
          meal_name?: string
          meal_order?: number
          plan_id?: string
          protein_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          achieved: boolean | null
          achieved_at: string | null
          goal_id: string
          id: string
          target_value: number | null
          title: string
        }
        Insert: {
          achieved?: boolean | null
          achieved_at?: string | null
          goal_id: string
          id?: string
          target_value?: number | null
          title: string
        }
        Update: {
          achieved?: boolean | null
          achieved_at?: string | null
          goal_id?: string
          id?: string
          target_value?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          calories_target: number | null
          carbs_g: number | null
          client_id: string
          created_at: string | null
          fat_g: number | null
          id: string
          meals_per_day: number | null
          name: string
          notes: string | null
          phase: number | null
          protein_g: number | null
          status: string
        }
        Insert: {
          calories_target?: number | null
          carbs_g?: number | null
          client_id: string
          created_at?: string | null
          fat_g?: number | null
          id?: string
          meals_per_day?: number | null
          name: string
          notes?: string | null
          phase?: number | null
          protein_g?: number | null
          status?: string
        }
        Update: {
          calories_target?: number | null
          carbs_g?: number | null
          client_id?: string
          created_at?: string | null
          fat_g?: number | null
          id?: string
          meals_per_day?: number | null
          name?: string
          notes?: string | null
          phase?: number | null
          protein_g?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          client_id: string
          end_week: number | null
          focus_items: string[] | null
          id: string
          name: string | null
          phase_goals: string[] | null
          phase_number: number | null
          start_week: number | null
          status: Database["public"]["Enums"]["phase_status"] | null
        }
        Insert: {
          client_id: string
          end_week?: number | null
          focus_items?: string[] | null
          id?: string
          name?: string | null
          phase_goals?: string[] | null
          phase_number?: number | null
          start_week?: number | null
          status?: Database["public"]["Enums"]["phase_status"] | null
        }
        Update: {
          client_id?: string
          end_week?: number | null
          focus_items?: string[] | null
          id?: string
          name?: string | null
          phase_goals?: string[] | null
          phase_number?: number | null
          start_week?: number | null
          status?: Database["public"]["Enums"]["phase_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "phases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          profile_image_url: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          age?: number | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          client_id: string
          id: string
          image_url: string
          photo_type: Database["public"]["Enums"]["photo_type"] | null
          uploaded_at: string | null
          week_number: number | null
        }
        Insert: {
          client_id: string
          id?: string
          image_url: string
          photo_type?: Database["public"]["Enums"]["photo_type"] | null
          uploaded_at?: string | null
          week_number?: number | null
        }
        Update: {
          client_id?: string
          id?: string
          image_url?: string
          photo_type?: Database["public"]["Enums"]["photo_type"] | null
          uploaded_at?: string | null
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          drip_unlock_week: number | null
          icon: string | null
          id: string
          published: boolean | null
          slug: string | null
          title: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          drip_unlock_week?: number | null
          icon?: string | null
          id?: string
          published?: boolean | null
          slug?: string | null
          title: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          drip_unlock_week?: number | null
          icon?: string | null
          id?: string
          published?: boolean | null
          slug?: string | null
          title?: string
        }
        Relationships: []
      }
      shared_documents: {
        Row: {
          client_id: string
          content: string | null
          created_at: string | null
          created_by: string | null
          doc_type: string
          id: string
          title: string
        }
        Insert: {
          client_id: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          doc_type?: string
          id?: string
          title: string
        }
        Update: {
          client_id?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          doc_type?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_days: {
        Row: {
          day_name: string
          day_order: number
          id: string
          program_id: string
        }
        Insert: {
          day_name: string
          day_order?: number
          id?: string
          program_id: string
        }
        Update: {
          day_name?: string
          day_order?: number
          id?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      training_exercises: {
        Row: {
          exercise_id: string
          exercise_order: number
          id: string
          notes: string | null
          reps: string | null
          rest_seconds: number | null
          sets: number
          tempo: string | null
          training_day_id: string
        }
        Insert: {
          exercise_id: string
          exercise_order?: number
          id?: string
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number
          tempo?: string | null
          training_day_id: string
        }
        Update: {
          exercise_id?: string
          exercise_order?: number
          id?: string
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          sets?: number
          tempo?: string | null
          training_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_exercises_training_day_id_fkey"
            columns: ["training_day_id"]
            isOneToOne: false
            referencedRelation: "training_days"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          name: string
          phase: number | null
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          name: string
          phase?: number | null
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          name?: string
          phase?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_checkins: {
        Row: {
          avg_calories: number | null
          body_fat_pct: number | null
          client_id: string
          client_notes: string | null
          coach_feedback: string | null
          created_at: string | null
          date: string | null
          energy_level: number | null
          id: string
          reviewed_at: string | null
          sleep_quality: number | null
          status: Database["public"]["Enums"]["checkin_status"] | null
          submitted_at: string | null
          week_number: number | null
          weight: number | null
          workouts_completed: number | null
          workouts_target: number | null
        }
        Insert: {
          avg_calories?: number | null
          body_fat_pct?: number | null
          client_id: string
          client_notes?: string | null
          coach_feedback?: string | null
          created_at?: string | null
          date?: string | null
          energy_level?: number | null
          id?: string
          reviewed_at?: string | null
          sleep_quality?: number | null
          status?: Database["public"]["Enums"]["checkin_status"] | null
          submitted_at?: string | null
          week_number?: number | null
          weight?: number | null
          workouts_completed?: number | null
          workouts_target?: number | null
        }
        Update: {
          avg_calories?: number | null
          body_fat_pct?: number | null
          client_id?: string
          client_notes?: string | null
          coach_feedback?: string | null
          created_at?: string | null
          date?: string | null
          energy_level?: number | null
          id?: string
          reviewed_at?: string | null
          sleep_quality?: number | null
          status?: Database["public"]["Enums"]["checkin_status"] | null
          submitted_at?: string | null
          week_number?: number | null
          weight?: number | null
          workouts_completed?: number | null
          workouts_target?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_checkins_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          client_id: string
          date: string
          id: string
          notes: string | null
          reps_completed: number | null
          set_number: number
          training_exercise_id: string
          weight_used: number | null
        }
        Insert: {
          client_id: string
          date?: string
          id?: string
          notes?: string | null
          reps_completed?: number | null
          set_number: number
          training_exercise_id: string
          weight_used?: number | null
        }
        Update: {
          client_id?: string
          date?: string
          id?: string
          notes?: string | null
          reps_completed?: number | null
          set_number?: number
          training_exercise_id?: string
          weight_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_training_exercise_id_fkey"
            columns: ["training_exercise_id"]
            isOneToOne: false
            referencedRelation: "training_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_coach: { Args: never; Returns: boolean }
    }
    Enums: {
      call_status: "scheduled" | "completed" | "cancelled" | "no_show"
      call_type:
        | "opstart"
        | "uge2_tjek"
        | "uge4_review"
        | "uge8_review"
        | "afslutning"
        | "ekstra"
      checkin_status: "pending" | "submitted" | "reviewed"
      client_status: "active" | "paused" | "completed" | "cancelled"
      goal_status: "active" | "achieved" | "failed"
      note_category:
        | "checkin"
        | "call"
        | "observation"
        | "adjustment"
        | "general"
      phase_status: "locked" | "active" | "completed"
      photo_type: "front" | "side" | "back"
      user_role: "coach" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      call_status: ["scheduled", "completed", "cancelled", "no_show"],
      call_type: [
        "opstart",
        "uge2_tjek",
        "uge4_review",
        "uge8_review",
        "afslutning",
        "ekstra",
      ],
      checkin_status: ["pending", "submitted", "reviewed"],
      client_status: ["active", "paused", "completed", "cancelled"],
      goal_status: ["active", "achieved", "failed"],
      note_category: [
        "checkin",
        "call",
        "observation",
        "adjustment",
        "general",
      ],
      phase_status: ["locked", "active", "completed"],
      photo_type: ["front", "side", "back"],
      user_role: ["coach", "client"],
    },
  },
} as const
