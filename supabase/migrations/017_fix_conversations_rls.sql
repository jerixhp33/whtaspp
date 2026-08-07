-- Update conversations SELECT policy to allow creator to select before members are added
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (
  created_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid())
);
