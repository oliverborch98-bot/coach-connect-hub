-- Add columns for onboarding data to client_profiles table
ALTER TABLE public.client_profiles
ADD COLUMN IF NOT EXISTS goal text,
ADD COLUMN IF NOT EXISTS experience_level text,
ADD COLUMN IF NOT EXISTS training_days_per_week integer,
ADD COLUMN IF NOT EXISTS diet_type text,
ADD COLUMN IF NOT EXISTS meals_per_day integer,
ADD COLUMN IF NOT EXISTS allergies text,
ADD COLUMN IF NOT EXISTS injuries text,
ADD COLUMN IF NOT EXISTS medications text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS height_cm integer,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Add RLS policy for the client to be able to update their own client_profile if it doesn't already exist
-- Actually, the user can already update their own client profile due to existing policies,
-- but we should ensure UPDATE policy exists for client_profiles.
-- Checking typical policies for client_profiles, usually the referenced user_id can select and update.
