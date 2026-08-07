-- Helper functions

CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  type TEXT,
  last_message_content TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.type,
    m.content,
    c.last_message_at,
    (SELECT COUNT(*) FROM messages m2 
     WHERE m2.conversation_id = c.id 
     AND m2.created_at > cm.last_read_at) as unread_count
  FROM conversations c
  JOIN conversation_members cm ON c.id = cm.conversation_id
  LEFT JOIN messages m ON c.last_message_id = m.id
  WHERE cm.user_id = p_user_id
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION search_users(p_query TEXT, p_current_user_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.display_name, p.avatar_url
  FROM profiles p
  WHERE (p.username ILIKE '%' || p_query || '%' OR p.display_name ILIKE '%' || p_query || '%')
  AND p.id != p_current_user_id
  AND NOT p.is_disabled
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users b 
    WHERE (b.user_id = p_current_user_id AND b.blocked_user_id = p.id)
       OR (b.user_id = p.id AND b.blocked_user_id = p_current_user_id)
  )
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_conversation_member(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM conversation_members 
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  ) INTO is_member;
  RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id UUID, p_blocked_by UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_blocked BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM blocked_users 
    WHERE user_id = p_blocked_by AND blocked_user_id = p_user_id
  ) INTO is_blocked;
  RETURN is_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_or_create_private_conversation(p_user1_id UUID, p_user2_id UUID)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  JOIN conversation_members cm1 ON c.id = cm1.conversation_id
  JOIN conversation_members cm2 ON c.id = cm2.conversation_id
  WHERE c.type = 'private' 
    AND cm1.user_id = p_user1_id 
    AND cm2.user_id = p_user2_id;

  IF v_conversation_id IS NULL THEN
    -- Create new
    INSERT INTO conversations (type, created_by) 
    VALUES ('private', p_user1_id) 
    RETURNING id INTO v_conversation_id;

    INSERT INTO conversation_members (conversation_id, user_id, role)
    VALUES 
      (v_conversation_id, p_user1_id, 'member'),
      (v_conversation_id, p_user2_id, 'member');
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION create_notification(p_user_id UUID, p_type TEXT, p_title TEXT, p_body TEXT, p_data JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, COALESCE(p_data, '{}'::jsonb));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION create_audit_log(p_actor_id UUID, p_action TEXT, p_resource_type TEXT, p_resource_id TEXT, p_metadata JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
  VALUES (p_actor_id, p_action, p_resource_type, p_resource_id, COALESCE(p_metadata, '{}'::jsonb));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION increment_api_key_usage(p_key_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE api_keys 
  SET request_count = request_count + 1,
      last_used_at = now()
  WHERE id = p_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE call_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
