-- MAX RESTORE P2: ONBOARDING
DO $$
DECLARE
    v_user_id UUID := '172e059a-4860-49da-9bce-d96efe2f9103';
    v_client_id UUID;
BEGIN
    SELECT id INTO v_client_id FROM public.client_profiles WHERE user_id = v_user_id;
    
    IF v_client_id IS NOT NULL THEN
        INSERT INTO public.onboarding_responses (client_id, full_name, age, phone, work_situation, stress_level, primary_goal)
        VALUES (v_client_id, 'Max Boel', 22, '+45 52300113', 'Tømrer', 3, 'Recomp')
        ON CONFLICT (client_id) DO UPDATE SET 
            age = EXCLUDED.age, 
            phone = EXCLUDED.phone, 
            work_situation = EXCLUDED.work_situation, 
            stress_level = EXCLUDED.stress_level;
    END IF;
END $$;
