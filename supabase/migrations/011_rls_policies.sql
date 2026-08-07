-- Enable RLS for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view non-disabled profiles" ON profiles FOR SELECT USING (NOT is_disabled);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- contacts
CREATE POLICY "Users can view own contacts" ON contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own contacts" ON contacts FOR DELETE USING (auth.uid() = user_id);

-- contact_requests
CREATE POLICY "Users can view own contact requests" ON contact_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can send requests" ON contact_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can update received requests" ON contact_requests FOR UPDATE USING (auth.uid() = to_user_id);

-- blocked_users
CREATE POLICY "Users can view own blocks" ON blocked_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blocks" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own blocks" ON blocked_users FOR DELETE USING (auth.uid() = user_id);

-- conversations
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid())
);

-- conversation_members
CREATE POLICY "Users can view conversation members" ON conversation_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Users can insert conversation members" ON conversation_members FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);
CREATE POLICY "Users can update own membership" ON conversation_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete membership" ON conversation_members FOR DELETE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid() AND cm.role IN ('admin','owner'))
);

-- messages
CREATE POLICY "Users can view conversation messages" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = sender_id);

-- message_attachments
CREATE POLICY "Users can view attachments" ON message_attachments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m 
    JOIN conversation_members cm ON m.conversation_id = cm.conversation_id 
    WHERE m.id = message_attachments.message_id AND cm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert attachments" ON message_attachments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM messages WHERE id = message_attachments.message_id AND sender_id = auth.uid())
);

-- message_reactions
CREATE POLICY "Users can view reactions" ON message_reactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m 
    JOIN conversation_members cm ON m.conversation_id = cm.conversation_id 
    WHERE m.id = message_reactions.message_id AND cm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert reactions" ON message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON message_reactions FOR DELETE USING (auth.uid() = user_id);

-- message_reads
CREATE POLICY "Users can view message reads" ON message_reads FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m 
    JOIN conversation_members cm ON m.conversation_id = cm.conversation_id 
    WHERE m.id = message_reads.message_id AND cm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert message reads" ON message_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- groups
CREATE POLICY "Users can view groups" ON groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = groups.conversation_id AND user_id = auth.uid()) OR is_public = true
);
CREATE POLICY "Users can insert groups" ON groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update groups" ON groups FOR UPDATE USING (
  EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = groups.conversation_id AND user_id = auth.uid() AND role IN ('admin','owner'))
);

-- calls
CREATE POLICY "Users can view own calls" ON calls FOR SELECT USING (
  EXISTS (SELECT 1 FROM call_participants WHERE call_id = calls.id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert calls" ON calls FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update calls" ON calls FOR UPDATE USING (
  EXISTS (SELECT 1 FROM call_participants WHERE call_id = calls.id AND user_id = auth.uid())
);

-- call_participants
CREATE POLICY "Users can view call participants" ON call_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM call_participants cp WHERE cp.call_id = call_participants.call_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Users can insert call participants" ON call_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own call status" ON call_participants FOR UPDATE USING (auth.uid() = user_id);

-- notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
-- Insert via system only

-- user_settings
CREATE POLICY "Users can access own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- privacy_settings
CREATE POLICY "Users can access own privacy settings" ON privacy_settings FOR ALL USING (auth.uid() = user_id);

-- reports
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Users can insert reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- audit_logs
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- api_keys
CREATE POLICY "Admins can view all keys, creators own keys" ON api_keys FOR SELECT USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can manage api keys" ON api_keys FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- api_usage
CREATE POLICY "Admins can view api usage" ON api_usage FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
