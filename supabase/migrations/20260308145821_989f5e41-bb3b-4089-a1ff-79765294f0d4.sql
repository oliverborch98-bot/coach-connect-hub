
CREATE TABLE public.body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric,
  body_fat_pct numeric,
  chest_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  left_arm_cm numeric,
  right_arm_cm numeric,
  left_thigh_cm numeric,
  right_thigh_cm numeric,
  shoulders_cm numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_select_own" ON public.body_measurements FOR SELECT
  USING (client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "client_insert_own" ON public.body_measurements FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "client_update_own" ON public.body_measurements FOR UPDATE
  USING (client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.body_measurements FOR ALL
  USING (is_coach());
