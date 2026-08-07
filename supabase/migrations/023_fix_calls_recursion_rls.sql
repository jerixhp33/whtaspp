-- Fix infinite recursion in calls and call_participants policies
DROP POLICY IF EXISTS "Users can view own calls" ON calls;
DROP POLICY IF EXISTS "Users can update calls" ON calls;
DROP POLICY IF EXISTS "Users can insert calls" ON calls;

CREATE POLICY "Users can view own calls" ON calls FOR SELECT USING (
  caller_id = auth.uid() OR
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM conversation_members cm 
    WHERE cm.conversation_id = calls.conversation_id AND cm.user_id = auth.uid()
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
  )
);

DROP POLICY IF EXISTS "Users can view call participants" ON call_participants;
DROP POLICY IF EXISTS "Users can insert call participants" ON call_participants;
DROP POLICY IF EXISTS "Users can update own call status" ON call_participants;

CREATE POLICY "Users can view call participants" ON call_participants FOR SELECT USING (
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can insert call participants" ON call_participants FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update own call status" ON call_participants FOR UPDATE USING (
  user_id = auth.uid()
);
