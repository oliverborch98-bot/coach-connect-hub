
-- Training programs
CREATE TABLE public.training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phase integer,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client view own programs" ON public.training_programs FOR SELECT USING (client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Coach manage programs" ON public.training_programs FOR ALL USING (is_coach());

-- Training days
CREATE TABLE public.training_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.training_programs(id) ON DELETE CASCADE,
  day_name text NOT NULL,
  day_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.training_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client view own training days" ON public.training_days FOR SELECT USING (program_id IN (SELECT id FROM training_programs WHERE client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Coach manage training days" ON public.training_days FOR ALL USING (is_coach());

-- Exercises library
CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text,
  video_url text,
  instructions text
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exercises" ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coach manage exercises" ON public.exercises FOR ALL USING (is_coach());

-- Training exercises (linking exercises to training days)
CREATE TABLE public.training_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_day_id uuid NOT NULL REFERENCES public.training_days(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sets integer NOT NULL DEFAULT 3,
  reps text DEFAULT '8-12',
  tempo text,
  rest_seconds integer,
  notes text,
  exercise_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.training_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client view own training exercises" ON public.training_exercises FOR SELECT USING (training_day_id IN (SELECT id FROM training_days WHERE program_id IN (SELECT id FROM training_programs WHERE client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()))));
CREATE POLICY "Coach manage training exercises" ON public.training_exercises FOR ALL USING (is_coach());

-- Workout logs
CREATE TABLE public.workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  training_exercise_id uuid NOT NULL REFERENCES public.training_exercises(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  set_number integer NOT NULL,
  reps_completed integer,
  weight_used numeric,
  notes text
);
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client manage own workout logs" ON public.workout_logs FOR ALL USING (client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Coach manage workout logs" ON public.workout_logs FOR ALL USING (is_coach());

-- Nutrition plans
CREATE TABLE public.nutrition_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  calories_target integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  meals_per_day integer DEFAULT 4,
  notes text,
  phase integer,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client view own nutrition plans" ON public.nutrition_plans FOR SELECT USING (client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Coach manage nutrition plans" ON public.nutrition_plans FOR ALL USING (is_coach());

-- Meals
CREATE TABLE public.meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.nutrition_plans(id) ON DELETE CASCADE,
  meal_name text NOT NULL,
  meal_order integer NOT NULL DEFAULT 0,
  description text,
  calories integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer
);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client view own meals" ON public.meals FOR SELECT USING (plan_id IN (SELECT id FROM nutrition_plans WHERE client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Coach manage meals" ON public.meals FOR ALL USING (is_coach());

-- Shared documents
CREATE TABLE public.shared_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  doc_type text NOT NULL DEFAULT 'custom',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client view own documents" ON public.shared_documents FOR SELECT USING (client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Coach manage documents" ON public.shared_documents FOR ALL USING (is_coach());

-- Document checklist items
CREATE TABLE public.document_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.shared_documents(id) ON DELETE CASCADE,
  item_text text NOT NULL,
  assigned_to text DEFAULT 'client',
  completed boolean DEFAULT false,
  deadline date
);
ALTER TABLE public.document_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client view own checklist items" ON public.document_checklist_items FOR SELECT USING (document_id IN (SELECT id FROM shared_documents WHERE client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Client update own checklist items" ON public.document_checklist_items FOR UPDATE USING (document_id IN (SELECT id FROM shared_documents WHERE client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid())));
CREATE POLICY "Coach manage checklist items" ON public.document_checklist_items FOR ALL USING (is_coach());

-- Resources (drip content)
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  content text,
  category text,
  icon text,
  drip_unlock_week integer DEFAULT 0,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view published resources" ON public.resources FOR SELECT TO authenticated USING (published = true);
CREATE POLICY "Coach manage resources" ON public.resources FOR ALL USING (is_coach());

-- Accountability scores
CREATE TABLE public.accountability_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  total_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  level text DEFAULT 'begynder'
);
ALTER TABLE public.accountability_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client view own score" ON public.accountability_scores FOR SELECT USING (client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Client update own score" ON public.accountability_scores FOR UPDATE USING (client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Coach manage scores" ON public.accountability_scores FOR ALL USING (is_coach());

-- Badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  criteria text
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coach manage badges" ON public.badges FOR ALL USING (is_coach());

-- Client badges
CREATE TABLE public.client_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now()
);
ALTER TABLE public.client_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client view own badges" ON public.client_badges FOR SELECT USING (client_id IN (SELECT id FROM client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Coach manage client badges" ON public.client_badges FOR ALL USING (is_coach());
