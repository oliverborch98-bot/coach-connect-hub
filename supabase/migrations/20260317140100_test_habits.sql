-- Phase 4: Seed Daily Habits for Test Client
DO $$ 
DECLARE 
  v_client_id UUID := '640e5572-227c-4b3c-9fe4-3c3b4989c845';
  v_client_profile_id UUID;
BEGIN
  SELECT id INTO v_client_profile_id FROM public.client_profiles WHERE user_id = v_client_id LIMIT 1;
  IF v_client_profile_id IS NOT NULL THEN
    INSERT INTO public.daily_habits (client_id, habit_name, habit_order, active)
    VALUES 
      (v_client_profile_id, 'Morgenritual', 1, true),
      (v_client_profile_id, 'Træning', 2, true),
      (v_client_profile_id, '3L Vand', 3, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
