
-- Recipes library
CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructions text,
  ingredients jsonb DEFAULT '[]'::jsonb,
  prep_time_min integer,
  calories integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  image_url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_select" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "coach_all" ON public.recipes FOR ALL USING (is_coach());

-- Link meals to recipes
ALTER TABLE public.meals ADD COLUMN recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL;
