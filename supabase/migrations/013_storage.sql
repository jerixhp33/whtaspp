-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('message-media', 'message-media', false, 52428800, NULL),
  ('voice-messages', 'voice-messages', false, 10485760, ARRAY['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm']),
  ('documents', 'documents', false, 104857600, NULL)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Set up Storage RLS policies

-- avatars
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar."
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar."
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- message-media
CREATE POLICY "Conversation members can read media"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'message-media' AND 
    EXISTS (
      SELECT 1 FROM public.conversation_members 
      WHERE conversation_id::text = (storage.foldername(name))[1] AND user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation members can upload media"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'message-media' AND 
    EXISTS (
      SELECT 1 FROM public.conversation_members 
      WHERE conversation_id::text = (storage.foldername(name))[1] AND user_id = auth.uid()
    )
  );

-- voice-messages
CREATE POLICY "Conversation members can read voice messages"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'voice-messages' AND 
    EXISTS (
      SELECT 1 FROM public.conversation_members 
      WHERE conversation_id::text = (storage.foldername(name))[1] AND user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation members can upload voice messages"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'voice-messages' AND 
    EXISTS (
      SELECT 1 FROM public.conversation_members 
      WHERE conversation_id::text = (storage.foldername(name))[1] AND user_id = auth.uid()
    )
  );

-- documents
CREATE POLICY "Conversation members can read documents"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND 
    EXISTS (
      SELECT 1 FROM public.conversation_members 
      WHERE conversation_id::text = (storage.foldername(name))[1] AND user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation members can upload documents"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    EXISTS (
      SELECT 1 FROM public.conversation_members 
      WHERE conversation_id::text = (storage.foldername(name))[1] AND user_id = auth.uid()
    )
  );
