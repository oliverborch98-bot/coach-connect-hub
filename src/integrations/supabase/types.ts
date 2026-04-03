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
      access_requests: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          reviewed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Relationships: []
      }
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
      body_measurements: {
        Row: {
          body_fat_pct: number | null
          chest_cm: number | null
          client_id: string
          created_at: string | null
          date: string
          hips_cm: number | null
          id: string
          left_arm_cm: number | null
          left_thigh_cm: number | null
          notes: string | null
          right_arm_cm: number | null
          right_thigh_cm: number | null
          shoulders_cm: number | null
          waist_cm: number | null
          weight: number | null
        }
        Insert: {
          body_fat_pct?: number | null
          chest_cm?: number | null
          client_id: string
          created_at?: string | null
          date?: string
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_thigh_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_thigh_cm?: number | null
          shoulders_cm?: number | null
          waist_cm?: number | null
          weight?: number | null
        }
        Update: {
          body_fat_pct?: number | null
          chest_cm?: number | null
          client_id?: string
          created_at?: string | null
          date?: string
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_thigh_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_thigh_cm?: number | null
          shoulders_cm?: number | null
          waist_cm?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      client_habits: {
        Row: {
          client_id: string
          created_at: string
          habit_id: string
          id: string
          is_active: boolean
          push_notification_time: string | null
          start_date: string
        }
        Insert: {
          client_id: string
          created_at?: string
          habit_id: string
          id?: string
          is_active?: boolean
          push_notification_time?: string | null
          start_date?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          habit_id?: string
          id?: string
          is_active?: boolean
          push_notification_time?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_habits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_habits_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          }
        ]
      }
      client_profiles: {
        Row: {
          binding_end: string | null
          coach_id: string
          created_at: string | null
          current_month: number | null
          current_phase: string | null
          goal_weight: number | null
          id: string
          is_re_sign: boolean | null
          monthly_price: number | null
          package_type: string
          primary_goal: string | null
          start_weight: number | null
          status: string | null
          subscription_start: string
          subscription_status: string | null
          user_id: string
          allergies: string | null
          birth_date: string | null
          diet_type: string | null
          experience_level: string | null
          gender: string | null
          goal: string | null
          height_cm: number | null
          injuries: string | null
          meals_per_day: number | null
          medications: string | null
          onboarding_completed: boolean | null
          training_days_per_week: number | null
        }
        Insert: {
          binding_end?: string | null
          coach_id: string
          created_at?: string | null
          current_month?: number | null
          current_phase?: string | null
          goal_weight?: number | null
          id?: string
          is_re_sign?: boolean | null
          monthly_price?: number | null
          package_type: string
          primary_goal?: string | null
          start_weight?: number | null
          status?: string | null
          subscription_start: string
          subscription_status?: string | null
          user_id: string
          allergies?: string | null
          birth_date?: string | null
          diet_type?: string | null
          experience_level?: string | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          injuries?: string | null
          meals_per_day?: number | null
          medications?: string | null
          onboarding_completed?: boolean | null
          training_days_per_week?: number | null
        }
        Update: {
          binding_end?: string | null
          coach_id?: string
          created_at?: string | null
          current_month?: number | null
          current_phase?: string | null
          goal_weight?: number | null
          id?: string
          is_re_sign?: boolean | null
          monthly_price?: number | null
          package_type?: string
          primary_goal?: string | null
          start_weight?: number | null
          status?: string | null
          subscription_start?: string
          subscription_status?: string | null
          user_id?: string
          allergies?: string | null
          birth_date?: string | null
          diet_type?: string | null
          experience_level?: string | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          injuries?: string | null
          meals_per_day?: number | null
          medications?: string | null
          onboarding_completed?: boolean | null
          training_days_per_week?: number | null
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
      coach_default_habits: {
        Row: {
          coach_id: string
          created_at: string | null
          habit_name: string
          habit_order: number | null
          id: string
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          habit_name: string
          habit_order?: number | null
          id?: string
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          habit_name?: string
          habit_order?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_default_habits_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_notes: {
        Row: {
          category: string | null
          client_id: string
          content: string
          created_at: string | null
          id: string
        }
        Insert: {
          category?: string | null
          client_id: string
          content: string
          created_at?: string | null
          id?: string
        }
        Update: {
          category?: string | null
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
          call_type: string | null
          client_id: string
          duration_minutes: number | null
          id: string
          is_facetime: boolean | null
          scheduled_at: string | null
          session_notes: string | null
          status: string | null
        }
        Insert: {
          action_items?: string | null
          call_type?: string | null
          client_id: string
          duration_minutes?: number | null
          id?: string
          is_facetime?: boolean | null
          scheduled_at?: string | null
          session_notes?: string | null
          status?: string | null
        }
        Update: {
          action_items?: string | null
          call_type?: string | null
          client_id?: string
          duration_minutes?: number | null
          id?: string
          is_facetime?: boolean | null
          scheduled_at?: string | null
          session_notes?: string | null
          status?: string | null
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
      email_logs: {
        Row: {
          client_id: string
          email_type: string | null
          id: string
          recipient_email: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          client_id: string
          email_type?: string | null
          id?: string
          recipient_email?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          client_id?: string
          email_type?: string | null
          id?: string
          recipient_email?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string | null
          difficulty: string | null
          equipment: string[] | null
          form_cues: string[] | null
          gif_url: string | null
          id: string
          instructions: string | null
          is_custom: boolean | null
          muscle_groups: string[] | null
          name: string
          name_da: string | null
          secondary_muscles: string[] | null
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          equipment?: string[] | null
          form_cues?: string[] | null
          gif_url?: string | null
          id?: string
          instructions?: string | null
          is_custom?: boolean | null
          muscle_groups?: string[] | null
          name: string
          name_da?: string | null
          secondary_muscles?: string[] | null
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          difficulty?: string | null
          equipment?: string[] | null
          form_cues?: string[] | null
          gif_url?: string | null
          id?: string
          instructions?: string | null
          is_custom?: boolean | null
          muscle_groups?: string[] | null
          name?: string
          name_da?: string | null
          secondary_muscles?: string[] | null
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
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
          client_habit_id: string
          completed: boolean
          created_at: string
          date: string
          id: string
          notes: string | null
        }
        Insert: {
          client_habit_id: string
          completed?: boolean
          created_at?: string
          date: string
          id?: string
          notes?: string | null
        }
        Update: {
          client_habit_id?: string
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_client_habit_id_fkey"
            columns: ["client_habit_id"]
            isOneToOne: false
            referencedRelation: "client_habits"
            referencedColumns: ["id"]
          }
        ]
      }
      habits: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          frequency: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
          meal_order: number | null
          plan_id: string
          protein_g: number | null
          recipe_id: string | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          description?: string | null
          fat_g?: number | null
          id?: string
          meal_name: string
          meal_order?: number | null
          plan_id: string
          protein_g?: number | null
          recipe_id?: string | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          description?: string | null
          fat_g?: number | null
          id?: string
          meal_name?: string
          meal_order?: number | null
          plan_id?: string
          protein_g?: number | null
          recipe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
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
          client_id: string | null
          created_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          fat_g: number | null
          id: string
          is_template: boolean | null
          meals_per_day: number | null
          name: string
          notes: string | null
          phase: string | null
          protein_g: number | null
          status: string | null
        }
        Insert: {
          calories_target?: number | null
          carbs_g?: number | null
          client_id?: string | null
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          fat_g?: number | null
          id?: string
          is_template?: boolean | null
          meals_per_day?: number | null
          name: string
          notes?: string | null
          phase?: string | null
          protein_g?: number | null
          status?: string | null
        }
        Update: {
          calories_target?: number | null
          carbs_g?: number | null
          client_id?: string | null
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          fat_g?: number | null
          id?: string
          is_template?: boolean | null
          meals_per_day?: number | null
          name?: string
          notes?: string | null
          phase?: string | null
          protein_g?: number | null
          status?: string | null
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
      onboarding_responses: {
        Row: {
          additional_notes: string | null
          age: number | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          dietary_restrictions: string | null
          equipment: string[] | null
          experience_level: string | null
          full_name: string | null
          id: string
          injury_history: string | null
          phone: string | null
          primary_goal: string | null
          sleep_hours: number | null
          stress_level: number | null
          work_situation: string | null
        }
        Insert: {
          additional_notes?: string | null
          age?: number | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          dietary_restrictions?: string | null
          equipment?: string[] | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          injury_history?: string | null
          phone?: string | null
          primary_goal?: string | null
          sleep_hours?: number | null
          stress_level?: number | null
          work_situation?: string | null
        }
        Update: {
          additional_notes?: string | null
          age?: number | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          dietary_restrictions?: string | null
          equipment?: string[] | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          injury_history?: string | null
          phone?: string | null
          primary_goal?: string | null
          sleep_hours?: number | null
          stress_level?: number | null
          work_situation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_responses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          amount_dkk: number | null
          client_id: string
          created_at: string | null
          event_type: string | null
          failure_reason: string | null
          id: string
          invoice_pdf_url: string | null
          status: string | null
          stripe_event_id: string | null
          stripe_invoice_id: string | null
        }
        Insert: {
          amount_dkk?: number | null
          client_id: string
          created_at?: string | null
          event_type?: string | null
          failure_reason?: string | null
          id?: string
          invoice_pdf_url?: string | null
          status?: string | null
          stripe_event_id?: string | null
          stripe_invoice_id?: string | null
        }
        Update: {
          amount_dkk?: number | null
          client_id?: string
          created_at?: string | null
          event_type?: string | null
          failure_reason?: string | null
          id?: string
          invoice_pdf_url?: string | null
          status?: string | null
          stripe_event_id?: string | null
          stripe_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_client_id_fkey"
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
          end_date: string | null
          focus_items: string[] | null
          id: string
          name: string | null
          phase_goals: string[] | null
          phase_number: number | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          client_id: string
          end_date?: string | null
          focus_items?: string[] | null
          id?: string
          name?: string | null
          phase_goals?: string[] | null
          phase_number?: number | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string
          end_date?: string | null
          focus_items?: string[] | null
          id?: string
          name?: string | null
          phase_goals?: string[] | null
          phase_number?: number | null
          start_date?: string | null
          status?: string | null
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
          must_change_password: boolean
          phone: string | null
          profile_image_url: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          full_name?: string | null
          id: string
          must_change_password?: boolean
          phone?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          age?: number | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          must_change_password?: boolean
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
          month_number: number | null
          photo_type: string | null
          uploaded_at: string | null
        }
        Insert: {
          client_id: string
          id?: string
          image_url: string
          month_number?: number | null
          photo_type?: string | null
          uploaded_at?: string | null
        }
        Update: {
          client_id?: string
          id?: string
          image_url?: string
          month_number?: number | null
          photo_type?: string | null
          uploaded_at?: string | null
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
      recipes: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          description: string | null
          fat_g: number | null
          id: string
          image_url: string | null
          ingredients: Json | null
          instructions: string | null
          prep_time_min: number | null
          protein_g: number | null
          tags: string[] | null
          title: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          description?: string | null
          fat_g?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string | null
          prep_time_min?: number | null
          protein_g?: number | null
          tags?: string[] | null
          title: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          description?: string | null
          fat_g?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string | null
          prep_time_min?: number | null
          protein_g?: number | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          drip_unlock_month: number | null
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
          drip_unlock_month?: number | null
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
          drip_unlock_month?: number | null
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
          doc_type: string | null
          id: string
          title: string
        }
        Insert: {
          client_id: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          doc_type?: string | null
          id?: string
          title: string
        }
        Update: {
          client_id?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          doc_type?: string | null
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
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          client_id: string
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payment_method_brand: string | null
          payment_method_last4: string | null
          product_name: string | null
          status: string | null
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          client_id: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          product_name?: string | null
          status?: string | null
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          client_id?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          product_name?: string | null
          status?: string | null
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "client_profiles"
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
          day_order: number
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
          rpe_target: number | null
          sets: number | null
          superset_group: string | null
          tempo: string | null
          training_day_id: string
        }
        Insert: {
          exercise_id: string
          exercise_order: number
          id?: string
          notes?: string | null
          reps?: string | null
          rest_seconds?: number | null
          rpe_target?: number | null
          sets?: number | null
          superset_group?: string | null
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
          rpe_target?: number | null
          sets?: number | null
          superset_group?: string | null
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
          client_id: string | null
          created_at: string | null
          id: string
          is_template: boolean | null
          name: string
          phase: string | null
          status: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_template?: boolean | null
          name: string
          phase?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_template?: boolean | null
          name?: string
          phase?: string | null
          status?: string | null
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
          checkin_number: number
          client_id: string
          client_notes: string | null
          coach_feedback: string | null
          created_at: string | null
          date: string | null
          energy_level: number | null
          id: string
          reviewed_at: string | null
          sleep_quality: number | null
          status: string | null
          submitted_at: string | null
          weight: number | null
          workouts_completed: number | null
          workouts_target: number | null
        }
        Insert: {
          avg_calories?: number | null
          body_fat_pct?: number | null
          checkin_number: number
          client_id: string
          client_notes?: string | null
          coach_feedback?: string | null
          created_at?: string | null
          date?: string | null
          energy_level?: number | null
          id?: string
          reviewed_at?: string | null
          sleep_quality?: number | null
          status?: string | null
          submitted_at?: string | null
          weight?: number | null
          workouts_completed?: number | null
          workouts_target?: number | null
        }
        Update: {
          avg_calories?: number | null
          body_fat_pct?: number | null
          checkin_number?: number
          client_id?: string
          client_notes?: string | null
          coach_feedback?: string | null
          created_at?: string | null
          date?: string | null
          energy_level?: number | null
          id?: string
          reviewed_at?: string | null
          sleep_quality?: number | null
          status?: string | null
          submitted_at?: string | null
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
          created_at: string | null
          date: string
          id: string
          notes: string | null
          reps_completed: number | null
          rpe_actual: number | null
          set_number: number
          training_exercise_id: string
          weight_used: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          reps_completed?: number | null
          rpe_actual?: number | null
          set_number: number
          training_exercise_id: string
          weight_used?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          reps_completed?: number | null
          rpe_actual?: number | null
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
      award_points: {
        Args: { p_client_id: string; p_points: number }
        Returns: undefined
      }
      is_coach: { Args: never; Returns: boolean }
    }
    Enums: {
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
      user_role: ["coach", "client"],
    },
  },
} as const
