-- Fix infinite recursion in conversation_members policies
DROP POLICY IF EXISTS "Users can view conversation members" ON conversation_members;
DROP POLICY IF EXISTS "Users can delete membership" ON conversation_members;

CREATE POLICY "Users can view conversation members" ON conversation_members 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete membership" ON conversation_members 
FOR DELETE USING (auth.uid() = user_id);
