-- Storage RLS Policies for authenticated users to upload and view media/voice/documents
CREATE POLICY "Authenticated users can upload objects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('voice-messages', 'message-media', 'documents', 'avatars'));

CREATE POLICY "Authenticated users can update own objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('voice-messages', 'message-media', 'documents', 'avatars'));

CREATE POLICY "Anyone can view public storage objects"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('voice-messages', 'message-media', 'documents', 'avatars'));
