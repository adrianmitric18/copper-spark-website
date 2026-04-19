CREATE POLICY "Admin can delete lead photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lead-photos' AND public.is_admin());