-- Create storage bucket for progress photos
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', true);

-- Allow clients to upload their own photos
CREATE POLICY "Client upload photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'progress-photos' AND
  auth.uid() IS NOT NULL
);

-- Allow anyone authenticated to view photos
CREATE POLICY "Authenticated view photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'progress-photos' AND
  auth.uid() IS NOT NULL
);

-- Allow clients to delete their own photos
CREATE POLICY "Client delete own photos" ON storage.objects FOR DELETE USING (
  bucket_id = 'progress-photos' AND
  auth.uid() IS NOT NULL
);

-- Coach can manage all storage
CREATE POLICY "Coach manage storage" ON storage.objects FOR ALL USING (
  bucket_id = 'progress-photos' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'coach'
);