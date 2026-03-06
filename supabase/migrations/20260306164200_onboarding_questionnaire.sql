-- Create onboarding_responses table
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_profiles(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add onboarding_completed column to client_profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='client_profiles' AND COLUMN_NAME='onboarding_completed') THEN
        ALTER TABLE public.client_profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Clients can view their own onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Clients can view their own onboarding responses" ON public.onboarding_responses
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.client_profiles WHERE id = client_id));

DROP POLICY IF EXISTS "Clients can insert their own onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Clients can insert their own onboarding responses" ON public.onboarding_responses
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.client_profiles WHERE id = client_id));

DROP POLICY IF EXISTS "Coaches can view all onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Coaches can view all onboarding responses" ON public.onboarding_responses
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach'));
