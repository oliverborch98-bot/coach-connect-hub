-- Safely rename old tables
ALTER TABLE IF EXISTS public.habit_logs RENAME TO old_habit_logs;
ALTER TABLE IF EXISTS public.daily_habits RENAME TO old_daily_habits;
ALTER TABLE IF EXISTS public.coach_default_habits RENAME TO old_coach_default_habits;

-- Create habits table
CREATE TABLE public.habits (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  frequency text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Create client_habits table
CREATE TABLE public.client_habits (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  push_notification_time time without time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id),
  UNIQUE(client_id, habit_id)
);

-- Create new habit_logs table
CREATE TABLE public.habit_logs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  client_habit_id uuid NOT NULL REFERENCES public.client_habits(id) ON DELETE CASCADE,
  date date NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id),
  UNIQUE(client_habit_id, date)
);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Habits Policies
CREATE POLICY "Coaches can manage their habits" ON public.habits
    FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "Clients can view their assigned habits" ON public.habits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.client_habits ch
            JOIN public.client_profiles cp ON ch.client_id = cp.id
            WHERE ch.habit_id = habits.id
            AND cp.user_id = auth.uid()
        )
    );

-- Client Habits Policies
CREATE POLICY "Coaches can manage habits for their clients" ON public.client_habits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.client_profiles cp
            WHERE cp.id = client_habits.client_id
            AND cp.coach_id = auth.uid()
        )
    );

CREATE POLICY "Clients can view their own habits" ON public.client_habits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.client_profiles cp
            WHERE cp.id = client_habits.client_id
            AND cp.user_id = auth.uid()
        )
    );
    
CREATE POLICY "Clients can update their own habits" ON public.client_habits
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.client_profiles cp
            WHERE cp.id = client_habits.client_id
            AND cp.user_id = auth.uid()
        )
    );

-- Habit Logs Policies
CREATE POLICY "Coaches can view client habit logs" ON public.habit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.client_habits ch
            JOIN public.client_profiles cp ON ch.client_id = cp.id
            WHERE ch.id = habit_logs.client_habit_id
            AND cp.coach_id = auth.uid()
        )
    );
    
CREATE POLICY "Clients can manage their own habit logs" ON public.habit_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.client_habits ch
            JOIN public.client_profiles cp ON ch.client_id = cp.id
            WHERE ch.id = habit_logs.client_habit_id
            AND cp.user_id = auth.uid()
        )
    );
