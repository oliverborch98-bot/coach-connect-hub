-- Phase 4: Seed Test Client Data for Verification
DO $$
DECLARE
    v_target_email TEXT := 'testklient@buildmethod.dk';
    v_user_id UUID := '640e5572-227c-4b3c-9fe4-3c3b4989c845'; -- Confirmed ID for Test Klient
    v_client_profile_id UUID;
    v_coach_id UUID;
BEGIN
    -- 1. Get Client Profile ID
    SELECT id INTO v_client_profile_id FROM public.client_profiles WHERE user_id = v_user_id LIMIT 1;
    
    IF v_client_profile_id IS NOT NULL THEN
        -- 2. Get Coach
        SELECT id INTO v_coach_id FROM public.profiles WHERE role = 'coach' LIMIT 1;

        -- 3. Create/Assign Training Program for Client
        INSERT INTO public.training_programs (client_id, name, phase, status, is_template)
        VALUES (v_client_profile_id, 'Audit Test Program', 'Foundation', 'active', false)
        ON CONFLICT DO NOTHING;

        -- 4. Create/Assign Nutrition Plan for Client
        INSERT INTO public.nutrition_plans (client_id, name, status, is_template, calories_target, protein_g, carbs_g, fat_g)
        VALUES (v_client_profile_id, 'Audit Test Plan', 'active', false, 2500, 180, 250, 70)
        ON CONFLICT DO NOTHING;

        -- 5. Seed Weight Measurements (for the last 7 days)
        INSERT INTO public.body_measurements (client_id, date, weight, notes)
        VALUES 
            (v_client_profile_id, CURRENT_DATE - INTERVAL '6 days', 85.5, 'Start'),
            (v_client_profile_id, CURRENT_DATE - INTERVAL '5 days', 85.2, NULL),
            (v_client_profile_id, CURRENT_DATE - INTERVAL '4 days', 85.0, NULL),
            (v_client_profile_id, CURRENT_DATE - INTERVAL '3 days', 84.8, NULL),
            (v_client_profile_id, CURRENT_DATE - INTERVAL '2 days', 84.5, NULL),
            (v_client_profile_id, CURRENT_DATE - INTERVAL '1 day', 84.3, NULL),
            (v_client_profile_id, CURRENT_DATE, 84.0, 'Progress check')
        ON CONFLICT DO NOTHING;

        -- 6. Seed Onboarding Response (ensure profile isn't blank)
        INSERT INTO public.onboarding_responses (user_id, age, phone_number, primary_goal, weight_goal, training_experience)
        VALUES (v_user_id, 30, '+45 12345678', 'Muskelmasse', 80, 'Intermediate')
        ON CONFLICT (user_id) DO UPDATE SET 
            age = EXCLUDED.age,
            primary_goal = EXCLUDED.primary_goal;

    END IF;
END $$;
