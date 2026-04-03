-- Migration: Add auto_onboarded_at and trigger for onboarding flow
-- Date: 2026-03-26

-- Add column for tracking when auto-onboarding occurred
ALTER TABLE public.client_profiles
ADD COLUMN IF NOT EXISTS auto_onboarded_at TIMESTAMPTZ;

-- Note: In a real Supabase environment, you would set up a Database Webhook 
-- through the UI to call the Edge Function. 
-- Here we provide the SQL skeleton for reference, though webhooks are typically 
-- managed via the Supabase Dashboard/CLI config.

-- Ensure the function exists (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_client_onboarding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- This function is a placeholder for the trigger action.
    -- The actual Edge Function call is usually handled by Supabase Database Webhooks.
    -- However, we can also use pg_net if available:
    -- PERFORM net.http_post(
    --   url := 'https://<project-ref>.supabase.co/functions/v1/auto-onboard-client',
    --   headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('request.jwt.claims')::jsonb->>'sub'),
    --   body := jsonb_build_object('record', row_to_json(NEW))
    -- );
    
    RETURN NEW;
END;
$$;

-- Create trigger (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_client_profile_created') THEN
        CREATE TRIGGER on_client_profile_created
        AFTER INSERT ON public.client_profiles
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_client_onboarding();
    END IF;
END $$;
