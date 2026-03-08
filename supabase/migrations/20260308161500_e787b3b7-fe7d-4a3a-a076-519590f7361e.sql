
CREATE TABLE public.coach_default_habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  habit_name text NOT NULL,
  habit_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coach_default_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_all" ON public.coach_default_habits FOR ALL USING (is_coach() AND coach_id = auth.uid());
