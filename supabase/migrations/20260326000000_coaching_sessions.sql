-- Migration: coaching_sessions table for Calendly integrations and booking

CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid REFERENCES auth.users NOT NULL,
  client_id uuid REFERENCES public.client_profiles(id) NOT NULL,
  scheduled_at timestamptz NOT NULL,
  calendly_event_url text,
  status text DEFAULT 'scheduled'::text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for Coaches
CREATE POLICY "Coaches can insert their own sessions"
  ON public.coaching_sessions FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can select their own sessions"
  ON public.coaching_sessions FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own sessions"
  ON public.coaching_sessions FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own sessions"
  ON public.coaching_sessions FOR DELETE
  USING (auth.uid() = coach_id);

-- Policies for Clients (read only)
CREATE POLICY "Clients can view their own sessions"
  ON public.coaching_sessions FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.client_profiles WHERE id = client_id));

CREATE POLICY "Clients can update their own sessions via Calendly sync if needed"
  ON public.coaching_sessions FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.client_profiles WHERE id = client_id));
