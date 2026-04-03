-- MAX RESTORE P3: TRAINING & NUTRITION
DO $$
DECLARE
    v_user_id UUID := '172e059a-4860-49da-9bce-d96efe2f9103';
    v_client_id UUID;
    v_program_id UUID;
    v_nutrition_id UUID;
BEGIN
    SELECT id INTO v_client_id FROM public.client_profiles WHERE user_id = v_user_id;
    
    IF v_client_id IS NOT NULL THEN
        -- Weekly Check-in #1
        INSERT INTO public.weekly_checkins (
            client_id, checkin_number, date, weight, avg_calories, workouts_completed, 
            workouts_target, energy_level, sleep_quality, client_notes, status, submitted_at
        )
        VALUES (
            v_client_id, 1, '2026-03-13', 87.8, 3200, 1, 4, 7, 7, 
            'Fod forstuvet, derfor ikke flere træninger.', 'submitted', '2026-03-13 10:00:00+00'
        )
        ON CONFLICT (client_id, checkin_number) DO NOTHING;

        -- Training Program
        INSERT INTO public.training_programs (client_id, name, phase, status)
        VALUES (v_client_id, '4 Ugers Recomp - Upper/Lower Split', 'foundation', 'active')
        RETURNING id INTO v_program_id;

        -- Nutrition Plan
        INSERT INTO public.nutrition_plans (client_id, name, phase, calories_target, protein_g, carbs_g, fat_g, meals_per_day, status)
        VALUES (v_client_id, 'Max Boel Recomp Foundation - 3200 kcal', 'foundation', 3200, 180, 400, 90, 5, 'active')
        RETURNING id INTO v_nutrition_id;

        INSERT INTO public.meals (plan_id, meal_name, meal_order, description, calories, protein_g, carbs_g, fat_g)
        VALUES 
        (v_nutrition_id, 'Frokost 1', 1, '200g kyllingebryst, 200g kogt ris', 650, 45, 80, 18),
        (v_nutrition_id, 'Aftensmad', 2, '200g laks, 200g søde kartofler', 700, 40, 70, 22);
    END IF;
END $$;
