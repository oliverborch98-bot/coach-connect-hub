
CREATE TABLE public.onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  full_name text,
  age integer,
  phone text,
  primary_goal text,
  experience_level text,
  equipment text[] DEFAULT '{}',
  dietary_restrictions text,
  work_situation text,
  sleep_hours numeric,
  stress_level integer,
  injury_history text,
  additional_notes text,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_insert_own" ON public.onboarding_responses
FOR INSERT WITH CHECK (
  client_id IN (SELECT cp.id FROM client_profiles cp WHERE cp.user_id = auth.uid())
);

CREATE POLICY "client_select_own" ON public.onboarding_responses
FOR SELECT USING (
  client_id IN (SELECT cp.id FROM client_profiles cp WHERE cp.user_id = auth.uid())
);

CREATE POLICY "coach_all" ON public.onboarding_responses
FOR ALL USING (is_coach());
