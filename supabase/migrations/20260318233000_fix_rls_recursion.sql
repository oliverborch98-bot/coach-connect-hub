-- Fix for Infinite Recursion in Profiles RLS Policy
-- This migration creates a security definer function to safely check user roles

-- 1. Create a function to check if a user is a coach
-- Using SECURITY DEFINER allows the function to bypass RLS for its own query
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'coach'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop the problematic recursive policy
DROP POLICY IF EXISTS "profiles_select_own_or_coach" ON public.profiles;

-- 3. Recreate the policy using the new function
-- Now it checks (auth.uid() = id) first, then falls back to is_coach()
-- which runs without triggering its own policy again.
CREATE POLICY "profiles_select_own_or_coach" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_coach());
