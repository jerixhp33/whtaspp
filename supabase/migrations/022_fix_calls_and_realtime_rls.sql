-- Fix calls schema constraints & add created_by column alias for maximum compatibility
ALTER TABLE calls ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE CASCADE;
UPDATE calls SET created_by = caller_id WHERE created_by IS NULL AND caller_id IS NOT NULL;

-- Loosen calls status constraint to support 'initiating', 'initiated', 'ringing', 'connecting', 'active', 'connected', 'ended', 'missed', 'rejected', 'busy'
ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_status_check;
ALTER TABLE calls ADD CONSTRAINT calls_status_check CHECK (status IN ('initiating', 'initiated', 'ringing', 'connecting', 'active', 'connected', 'ended', 'missed', 'rejected', 'busy'));

-- Fix Calls RLS Policies so other users in conversation can receive Realtime INSERT & UPDATE
DROP POLICY IF EXISTS "Users can view own calls" ON calls;
DROP POLICY IF EXISTS "Users can update calls" ON calls;
DROP POLICY IF EXISTS "Users can insert calls" ON calls;

CREATE POLICY "Users can view own calls" ON calls FOR SELECT USING (
  caller_id = auth.uid() OR
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM conversation_members cm 
    WHERE cm.conversation_id = calls.conversation_id AND cm.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM call_participants cp 
    WHERE cp.call_id = calls.id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert calls" ON calls FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update calls" ON calls FOR UPDATE USING (
  caller_id = auth.uid() OR
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM conversation_members cm 
    WHERE cm.conversation_id = calls.conversation_id AND cm.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM call_participants cp 
    WHERE cp.call_id = calls.id AND cp.user_id = auth.uid()
  )
);

-- Fix Call Participants RLS Policies
DROP POLICY IF EXISTS "Users can view call participants" ON call_participants;
DROP POLICY IF EXISTS "Users can insert call participants" ON call_participants;
DROP POLICY IF EXISTS "Users can update own call status" ON call_participants;

CREATE POLICY "Users can view call participants" ON call_participants FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM calls c
    JOIN conversation_members cm ON c.conversation_id = cm.conversation_id
    WHERE c.id = call_participants.call_id AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert call participants" ON call_participants FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update own call status" ON call_participants FOR UPDATE USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM calls c WHERE c.id = call_participants.call_id AND (c.caller_id = auth.uid() OR c.created_by = auth.uid())
  )
);

-- Add all interactive tables to Supabase Realtime publication
DO $$
BEGIN
  -- message_attachments
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_attachments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_attachments;
  END IF;

  -- message_reactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
  END IF;

  -- message_reads
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_reads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reads;
  END IF;

  -- calls
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'calls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE calls;
  END IF;

  -- call_participants
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'call_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE call_participants;
  END IF;
END $$;
