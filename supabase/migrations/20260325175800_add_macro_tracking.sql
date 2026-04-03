ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS daily_calories_goal integer;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS daily_protein_goal integer;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS daily_carbs_goal integer;
ALTER TABLE client_profiles ADD COLUMN IF NOT EXISTS daily_fat_goal integer;

CREATE TABLE IF NOT EXISTS food_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES client_profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    meal_name text NOT NULL,
    calories integer,
    protein integer,
    carbs integer,
    fat integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES client_profiles(id) ON DELETE CASCADE;

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Clients can view their own food logs"
  ON food_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM client_profiles WHERE client_profiles.id = food_logs.client_id AND client_profiles.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Clients can insert their own food logs"
  ON food_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM client_profiles WHERE client_profiles.id = food_logs.client_id AND client_profiles.user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Coaches can view their clients food logs"
  ON food_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM client_profiles WHERE client_profiles.id = food_logs.client_id AND client_profiles.coach_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
