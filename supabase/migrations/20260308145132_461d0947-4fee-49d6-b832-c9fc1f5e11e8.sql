
-- Allow clients to update meals in their own nutrition plans (for swapping)
CREATE POLICY "client_update_own" ON public.meals
FOR UPDATE
USING (
  plan_id IN (
    SELECT np.id FROM nutrition_plans np
    WHERE np.client_id IN (
      SELECT cp.id FROM client_profiles cp
      WHERE cp.user_id = auth.uid()
    )
  )
);
