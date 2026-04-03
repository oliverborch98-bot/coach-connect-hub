-- Drop existing conflicting policies to ensure a clean slate
DROP POLICY IF EXISTS "coach_all" ON public.profiles;
DROP POLICY IF EXISTS "user_select_own" ON public.profiles;
DROP POLICY IF EXISTS "user_update_own" ON public.profiles;
DROP POLICY IF EXISTS "public_profile_access" ON public.profiles;

-- 1. INSERT: Authenticated users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. SELECT: Authenticated users can read their own profile OR coaches can read all
CREATE POLICY "profiles_select_own_or_coach" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'coach');

-- 3. UPDATE: Authenticated users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
