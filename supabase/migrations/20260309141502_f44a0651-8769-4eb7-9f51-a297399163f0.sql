CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (no auth required)
CREATE POLICY "anyone_can_insert" ON public.access_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only coach can view/manage
CREATE POLICY "coach_select" ON public.access_requests
  FOR SELECT TO authenticated
  USING (is_coach());

CREATE POLICY "coach_update" ON public.access_requests
  FOR UPDATE TO authenticated
  USING (is_coach());

CREATE POLICY "coach_delete" ON public.access_requests
  FOR DELETE TO authenticated
  USING (is_coach());