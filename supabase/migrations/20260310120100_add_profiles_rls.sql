-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow coaches to do everything with all profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'coach_all'
    ) THEN
        CREATE POLICY "coach_all" ON public.profiles
        FOR ALL TO authenticated
        USING (is_coach());
    END IF;
END $$;

-- Allow anyone authenticated to read their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'user_select_own'
    ) THEN
        CREATE POLICY "user_select_own" ON public.profiles
        FOR SELECT TO authenticated
        USING (id = auth.uid());
    END IF;
END $$;

-- Allow anyone authenticated to update their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'user_update_own'
    ) THEN
        CREATE POLICY "user_update_own" ON public.profiles
        FOR UPDATE TO authenticated
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid());
    END IF;
END $$;
