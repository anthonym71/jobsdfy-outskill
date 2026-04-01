CREATE POLICY "Users can delete own matches"
ON public.job_matches
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own non-negotiables"
ON public.user_non_negotiables
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);