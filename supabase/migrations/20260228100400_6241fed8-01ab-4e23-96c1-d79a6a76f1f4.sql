
-- THE BUILD METHOD v2 — COMPLETE RESET
-- Drop ALL tables including exercises
DROP TABLE IF EXISTS document_checklist_items CASCADE;
DROP TABLE IF EXISTS shared_documents CASCADE;
DROP TABLE IF EXISTS workout_logs CASCADE;
DROP TABLE IF EXISTS training_exercises CASCADE;
DROP TABLE IF EXISTS training_days CASCADE;
DROP TABLE IF EXISTS training_programs CASCADE;
DROP TABLE IF EXISTS meals CASCADE;
DROP TABLE IF EXISTS nutrition_plans CASCADE;
DROP TABLE IF EXISTS habit_logs CASCADE;
DROP TABLE IF EXISTS daily_habits CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS coaching_calls CASCADE;
DROP TABLE IF EXISTS coach_notes CASCADE;
DROP TABLE IF EXISTS progress_photos CASCADE;
DROP TABLE IF EXISTS phases CASCADE;
DROP TABLE IF EXISTS weekly_checkins CASCADE;
DROP TABLE IF EXISTS client_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS accountability_scores CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS payment_events CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;

-- Drop old enums (keep user_role)
DROP TYPE IF EXISTS call_status CASCADE;
DROP TYPE IF EXISTS call_type CASCADE;
DROP TYPE IF EXISTS checkin_status CASCADE;
DROP TYPE IF EXISTS client_status CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS note_category CASCADE;
DROP TYPE IF EXISTS phase_status CASCADE;
DROP TYPE IF EXISTS photo_type CASCADE;

-- Truncate profiles
TRUNCATE public.profiles CASCADE;

-- client_profiles
CREATE TABLE public.client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES public.profiles(id) NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('the_system', 'build_method')),
  subscription_start DATE NOT NULL,
  binding_end DATE,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'paused', 'cancelled', 'completed')),
  monthly_price INT,
  is_re_sign BOOLEAN DEFAULT FALSE,
  current_month INT DEFAULT 1,
  current_phase TEXT DEFAULT 'foundation' CHECK (current_phase IN ('foundation', 'acceleration', 'transformation')),
  start_weight DECIMAL,
  goal_weight DECIMAL,
  primary_goal TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  product_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  payment_method_last4 TEXT,
  payment_method_brand TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_invoice_id TEXT,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT,
  amount_dkk DECIMAL,
  status TEXT,
  invoice_pdf_url TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_da TEXT,
  category TEXT CHECK (category IN ('push', 'pull', 'legs', 'core', 'cardio', 'olympic', 'mobility', 'compound')),
  muscle_groups TEXT[],
  secondary_muscles TEXT[],
  equipment TEXT[],
  difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  video_url TEXT,
  gif_url TEXT,
  instructions TEXT,
  form_cues TEXT[],
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phase TEXT CHECK (phase IN ('foundation', 'acceleration', 'transformation')),
  is_template BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.training_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.training_programs(id) ON DELETE CASCADE NOT NULL,
  day_name TEXT NOT NULL,
  day_order INT NOT NULL
);

CREATE TABLE public.training_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_day_id UUID REFERENCES public.training_days(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
  sets INT DEFAULT 3,
  reps TEXT DEFAULT '8-12',
  tempo TEXT,
  rest_seconds INT DEFAULT 90,
  rpe_target INT,
  notes TEXT,
  exercise_order INT NOT NULL,
  superset_group TEXT
);

CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  training_exercise_id UUID REFERENCES public.training_exercises(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  set_number INT NOT NULL,
  reps_completed INT,
  weight_used DECIMAL,
  rpe_actual INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.nutrition_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phase TEXT CHECK (phase IN ('foundation', 'acceleration', 'transformation')),
  calories_target INT,
  protein_g INT,
  carbs_g INT,
  fat_g INT,
  meals_per_day INT DEFAULT 4,
  notes TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.nutrition_plans(id) ON DELETE CASCADE NOT NULL,
  meal_name TEXT NOT NULL,
  meal_order INT DEFAULT 0,
  description TEXT,
  calories INT,
  protein_g INT,
  carbs_g INT,
  fat_g INT
);

CREATE TABLE public.weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  checkin_number INT NOT NULL,
  date DATE,
  weight DECIMAL,
  body_fat_pct DECIMAL,
  avg_calories INT,
  workouts_completed INT,
  workouts_target INT DEFAULT 4,
  energy_level INT,
  sleep_quality INT,
  client_notes TEXT,
  coach_feedback TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'reviewed')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  month_number INT,
  photo_type TEXT CHECK (photo_type IN ('front', 'side', 'back')),
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  phase_number INT CHECK (phase_number IN (1, 2, 3)),
  name TEXT,
  start_date DATE,
  end_date DATE,
  focus_items TEXT[],
  phase_goals TEXT[],
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'completed'))
);

CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  start_value DECIMAL,
  target_value DECIMAL,
  current_value DECIMAL,
  unit TEXT DEFAULT 'kg',
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_value DECIMAL,
  achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMPTZ
);

CREATE TABLE public.daily_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  habit_name TEXT NOT NULL,
  habit_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES public.daily_habits(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE public.coaching_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  call_type TEXT CHECK (call_type IN ('kickoff', 'check_in', 'review', 'facetime_training', 'physical_training', 'extra')),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INT DEFAULT 30,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  session_notes TEXT,
  action_items TEXT,
  is_facetime BOOLEAN DEFAULT FALSE
);

CREATE TABLE public.coach_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('checkin', 'call', 'observation', 'adjustment', 'general')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  content TEXT,
  category TEXT,
  icon TEXT,
  drip_unlock_month INT DEFAULT 0,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.accountability_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_points INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  level TEXT DEFAULT 'begynder' CHECK (level IN ('begynder', 'builder', 'disciplined', 'machine', 'built'))
);

CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria TEXT
);

CREATE TABLE public.client_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.shared_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  doc_type TEXT DEFAULT 'custom',
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.document_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.shared_documents(id) ON DELETE CASCADE NOT NULL,
  item_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  assigned_to TEXT DEFAULT 'client',
  deadline DATE
);

CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.client_profiles(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT,
  recipient_email TEXT,
  subject TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent'
);

-- RLS
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountability_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "coach_all" ON public.client_profiles FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.client_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "client_update_own" ON public.client_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "coach_all" ON public.subscriptions FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.subscriptions FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.payment_events FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.payment_events FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "anyone_select" ON public.exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "coach_all" ON public.exercises FOR ALL TO authenticated USING (is_coach());

CREATE POLICY "coach_all" ON public.training_programs FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.training_programs FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.training_days FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.training_days FOR SELECT TO authenticated USING (program_id IN (SELECT id FROM public.training_programs WHERE client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())));

CREATE POLICY "coach_all" ON public.training_exercises FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.training_exercises FOR SELECT TO authenticated USING (training_day_id IN (SELECT id FROM public.training_days WHERE program_id IN (SELECT id FROM public.training_programs WHERE client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()))));

CREATE POLICY "coach_all" ON public.workout_logs FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_all_own" ON public.workout_logs FOR ALL TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.nutrition_plans FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.nutrition_plans FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.meals FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.meals FOR SELECT TO authenticated USING (plan_id IN (SELECT id FROM public.nutrition_plans WHERE client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())));

CREATE POLICY "coach_all" ON public.weekly_checkins FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.weekly_checkins FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "client_insert_own" ON public.weekly_checkins FOR INSERT TO authenticated WITH CHECK (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "client_update_own" ON public.weekly_checkins FOR UPDATE TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.progress_photos FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.progress_photos FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "client_insert_own" ON public.progress_photos FOR INSERT TO authenticated WITH CHECK (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "client_update_own" ON public.progress_photos FOR UPDATE TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.phases FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.phases FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.goals FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.goals FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "client_update_own" ON public.goals FOR UPDATE TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.milestones FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.milestones FOR SELECT TO authenticated USING (goal_id IN (SELECT id FROM public.goals WHERE client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())));
CREATE POLICY "client_update_own" ON public.milestones FOR UPDATE TO authenticated USING (goal_id IN (SELECT id FROM public.goals WHERE client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())));

CREATE POLICY "coach_all" ON public.daily_habits FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.daily_habits FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "client_update_own" ON public.daily_habits FOR UPDATE TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.habit_logs FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.habit_logs FOR SELECT TO authenticated USING (habit_id IN (SELECT id FROM public.daily_habits WHERE client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())));
CREATE POLICY "client_insert_own" ON public.habit_logs FOR INSERT TO authenticated WITH CHECK (habit_id IN (SELECT id FROM public.daily_habits WHERE client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())));
CREATE POLICY "client_update_own" ON public.habit_logs FOR UPDATE TO authenticated USING (habit_id IN (SELECT id FROM public.daily_habits WHERE client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())));

CREATE POLICY "coach_all" ON public.coaching_calls FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.coaching_calls FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.coach_notes FOR ALL TO authenticated USING (is_coach());

CREATE POLICY "coach_all" ON public.messages FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "client_insert_own" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

CREATE POLICY "coach_all" ON public.resources FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "anyone_select_published" ON public.resources FOR SELECT TO authenticated USING (published = true);

CREATE POLICY "coach_all" ON public.notifications FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "client_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "coach_all" ON public.accountability_scores FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.accountability_scores FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));
CREATE POLICY "client_update_own" ON public.accountability_scores FOR UPDATE TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "anyone_select" ON public.badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "coach_all" ON public.badges FOR ALL TO authenticated USING (is_coach());

CREATE POLICY "coach_all" ON public.client_badges FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.client_badges FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.shared_documents FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.shared_documents FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

CREATE POLICY "coach_all" ON public.document_checklist_items FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.document_checklist_items FOR SELECT TO authenticated USING (document_id IN (SELECT id FROM public.shared_documents WHERE client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())));
CREATE POLICY "client_update_own" ON public.document_checklist_items FOR UPDATE TO authenticated USING (document_id IN (SELECT id FROM public.shared_documents WHERE client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())));

CREATE POLICY "coach_all" ON public.email_logs FOR ALL TO authenticated USING (is_coach());
CREATE POLICY "client_select_own" ON public.email_logs FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
