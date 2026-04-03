-- MAX RESTORE P1: PROFILE & CLIENT PROFILE (DYNAMIC ID)
DO $$
DECLARE
    v_target_email TEXT := 'maxsorensen10@hotmail.com';
    v_user_id UUID;
    v_coach_id UUID;
BEGIN
    -- Try to find the user in auth.users by email
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email LIMIT 1;
    
    -- If user found, proceed with Profile and Client Profile
    IF v_user_id IS NOT NULL THEN
        -- Get Coach
        SELECT id INTO v_coach_id FROM public.profiles WHERE role = 'coach' LIMIT 1;
        IF v_coach_id IS NULL THEN
            v_coach_id := 'd3b07384-dead-4bee-b0ef-deadbeef0001';
            INSERT INTO public.profiles (id, full_name, role, must_change_password)
            VALUES (v_coach_id, 'System Coach', 'coach', false) ON CONFLICT (id) DO NOTHING;
        END IF;

        -- Ensure Profile exists
        INSERT INTO public.profiles (id, full_name, role, must_change_password)
        VALUES (v_user_id, 'Max Boel', 'client', false)
        ON CONFLICT (id) DO UPDATE SET 
            full_name = EXCLUDED.full_name,
            must_change_password = false;

        -- Ensure Client Profile exists
        INSERT INTO public.client_profiles (user_id, coach_id, package_type, subscription_start, binding_end, monthly_price, status)
        VALUES (v_user_id, v_coach_id, 'the_system', '2026-03-09', '2026-09-09', 1000, 'active')
        ON CONFLICT (user_id) DO UPDATE SET package_type = EXCLUDED.package_type, status = EXCLUDED.status;
    ELSE
        -- If user NOT found, we can't restore profiles. 
        -- We'll log an error or raise a notice to be caught in push output.
        RAISE EXCEPTION 'USER NOT FOUND: Email % is NOT in auth.users table on this database!', v_target_email;
    END IF;
END $$;
