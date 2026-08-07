-- 024_notifications_system.sql
-- Comprehensive Production Notification System Schema & Triggers

-- 1. Enhance notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES messages(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Drop check constraint if present and re-add with all required notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'message',
    'mention',
    'reply',
    'reaction',
    'forward',
    'contact_request',
    'contact_accepted',
    'call_incoming',
    'call_missed',
    'group_invite',
    'group_added',
    'group_removed',
    'group_admin',
    'system'
  ));

-- 2. Create notification_devices table for Web & Mobile Push subscriptions
CREATE TABLE IF NOT EXISTS notification_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT CHECK (platform IN ('web', 'android', 'ios')) NOT NULL,
  device_id TEXT NOT NULL,
  push_token TEXT,
  endpoint TEXT,
  public_key TEXT,
  auth_key TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, platform, device_id)
);

-- 3. Enhance user_settings with detailed notification preferences
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_messages BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_groups BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_mentions BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_replies BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_reactions BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_requests BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_calls BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS vibration_enabled BOOLEAN DEFAULT true;

-- 4. Enable RLS on notifications and notification_devices
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_devices ENABLE ROW LEVEL SECURITY;

-- Notifications RLS
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" 
  ON notifications FOR DELETE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users or triggers can insert notifications" ON notifications;
CREATE POLICY "Authenticated users or triggers can insert notifications" 
  ON notifications FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Notification Devices RLS
DROP POLICY IF EXISTS "Users can view own notification devices" ON notification_devices;
CREATE POLICY "Users can view own notification devices" 
  ON notification_devices FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own notification devices" ON notification_devices;
CREATE POLICY "Users can manage own notification devices" 
  ON notification_devices FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_devices_user ON notification_devices(user_id, is_active);

-- 6. Trigger Function: Automatically create notifications on new message
CREATE OR REPLACE FUNCTION public.fn_notify_on_message()
RETURNS trigger AS $$
DECLARE
  sender_prof RECORD;
  conv RECORD;
  member RECORD;
  user_pref RECORD;
  notif_type TEXT;
  notif_title TEXT;
  notif_body TEXT;
  member_username TEXT;
  is_mentioned BOOLEAN;
  is_reply_to_member BOOLEAN;
  replied_msg_sender UUID;
BEGIN
  -- Retrieve sender profile
  SELECT id, display_name, username, avatar_url INTO sender_prof 
  FROM profiles WHERE id = NEW.sender_id;

  -- Retrieve conversation details
  SELECT id, type INTO conv FROM conversations WHERE id = NEW.conversation_id;

  -- If message is a reply, find recipient of reply
  IF NEW.reply_to_id IS NOT NULL THEN
    SELECT sender_id INTO replied_msg_sender FROM messages WHERE id = NEW.reply_to_id;
  END IF;

  -- Iterate through all conversation members except sender
  FOR member IN 
    SELECT cm.user_id, p.username 
    FROM conversation_members cm
    JOIN profiles p ON p.id = cm.user_id
    WHERE cm.conversation_id = NEW.conversation_id AND cm.user_id != NEW.sender_id
  LOOP
    -- Retrieve recipient settings
    SELECT 
      notifications_enabled,
      message_preview,
      notify_messages,
      notify_groups,
      notify_mentions,
      notify_replies
    INTO user_pref
    FROM user_settings
    WHERE user_id = member.user_id;

    -- Default to true if no settings row found
    IF user_pref.notifications_enabled IS NULL OR user_pref.notifications_enabled = true THEN
      
      -- Check mention (@username)
      is_mentioned := false;
      IF member.username IS NOT NULL AND NEW.content IS NOT NULL THEN
        IF position('@' || member.username IN NEW.content) > 0 THEN
          is_mentioned := true;
        END IF;
      END IF;

      -- Check reply
      is_reply_to_member := (replied_msg_sender IS NOT NULL AND replied_msg_sender = member.user_id);

      -- Determine notification type
      IF is_mentioned AND (user_pref.notify_mentions IS NULL OR user_pref.notify_mentions = true) THEN
        notif_type := 'mention';
        notif_title := COALESCE(sender_prof.display_name, sender_prof.username, 'Someone') || ' mentioned you';
      ELSIF is_reply_to_member AND (user_pref.notify_replies IS NULL OR user_pref.notify_replies = true) THEN
        notif_type := 'reply';
        notif_title := COALESCE(sender_prof.display_name, sender_prof.username, 'Someone') || ' replied to your message';
      ELSE
        notif_type := 'message';
        IF conv.type = 'group' THEN
          notif_title := COALESCE(sender_prof.display_name, sender_prof.username, 'Someone');
        ELSE
          notif_title := COALESCE(sender_prof.display_name, sender_prof.username, 'New Message');
        END IF;
      END IF;

      -- Determine body (Respect privacy mode: message_preview)
      IF user_pref.message_preview = false THEN
        notif_body := 'New message received';
      ELSE
        IF NEW.message_type = 'image' THEN
          notif_body := '📷 Photo' || CASE WHEN length(COALESCE(NEW.content, '')) > 0 THEN ': ' || NEW.content ELSE '' END;
        ELSIF NEW.message_type = 'video' THEN
          notif_body := '🎥 Video' || CASE WHEN length(COALESCE(NEW.content, '')) > 0 THEN ': ' || NEW.content ELSE '' END;
        ELSIF NEW.message_type = 'voice' THEN
          notif_body := '🎤 Voice message';
        ELSIF NEW.message_type = 'audio' THEN
          notif_body := '🎵 Audio' || CASE WHEN length(COALESCE(NEW.content, '')) > 0 THEN ': ' || NEW.content ELSE '' END;
        ELSIF NEW.message_type = 'document' THEN
          notif_body := '📄 Document' || CASE WHEN length(COALESCE(NEW.content, '')) > 0 THEN ': ' || NEW.content ELSE '' END;
        ELSE
          notif_body := COALESCE(NEW.content, 'New message');
        END IF;
      END IF;

      -- Check group notification toggle
      IF conv.type = 'group' AND user_pref.notify_groups = false AND NOT is_mentioned THEN
        -- Skip normal group message if group notifications disabled
        CONTINUE;
      END IF;

      -- Check direct message toggle
      IF conv.type = 'direct' AND user_pref.notify_messages = false AND NOT is_mentioned AND NOT is_reply_to_member THEN
        CONTINUE;
      END IF;

      -- Insert notification record
      INSERT INTO notifications (
        user_id,
        actor_id,
        type,
        conversation_id,
        message_id,
        title,
        body,
        metadata,
        data,
        is_read,
        created_at
      ) VALUES (
        member.user_id,
        NEW.sender_id,
        notif_type,
        NEW.conversation_id,
        NEW.id,
        notif_title,
        notif_body,
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'message_id', NEW.id,
          'message_type', NEW.message_type,
          'sender_id', NEW.sender_id,
          'sender_name', COALESCE(sender_prof.display_name, sender_prof.username, 'User'),
          'avatar_url', sender_prof.avatar_url
        ),
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'message_id', NEW.id
        ),
        false,
        now()
      );

    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_message ON messages;
CREATE TRIGGER trg_notify_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.fn_notify_on_message();

-- 7. Trigger Function: Notify on reaction
CREATE OR REPLACE FUNCTION public.fn_notify_on_reaction()
RETURNS trigger AS $$
DECLARE
  target_msg RECORD;
  actor_prof RECORD;
  user_pref RECORD;
BEGIN
  -- Retrieve target message details
  SELECT id, sender_id, conversation_id, content INTO target_msg 
  FROM messages WHERE id = NEW.message_id;

  -- Do not notify if user reacted to their own message
  IF target_msg.sender_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Check recipient preferences
  SELECT notifications_enabled, notify_reactions INTO user_pref 
  FROM user_settings WHERE user_id = target_msg.sender_id;

  IF user_pref.notifications_enabled = false OR user_pref.notify_reactions = false THEN
    RETURN NEW;
  END IF;

  -- Retrieve actor profile
  SELECT id, display_name, username, avatar_url INTO actor_prof 
  FROM profiles WHERE id = NEW.user_id;

  -- Insert reaction notification
  INSERT INTO notifications (
    user_id,
    actor_id,
    type,
    conversation_id,
    message_id,
    title,
    body,
    metadata,
    data,
    is_read,
    created_at
  ) VALUES (
    target_msg.sender_id,
    NEW.user_id,
    'reaction',
    target_msg.conversation_id,
    NEW.message_id,
    COALESCE(actor_prof.display_name, actor_prof.username, 'Someone') || ' reacted ' || NEW.emoji,
    'Reacted ' || NEW.emoji || ' to your message',
    jsonb_build_object(
      'conversation_id', target_msg.conversation_id,
      'message_id', NEW.message_id,
      'emoji', NEW.emoji,
      'actor_id', NEW.user_id,
      'actor_name', COALESCE(actor_prof.display_name, actor_prof.username, 'User'),
      'avatar_url', actor_prof.avatar_url
    ),
    jsonb_build_object(
      'conversation_id', target_msg.conversation_id,
      'message_id', NEW.message_id
    ),
    false,
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_reaction ON message_reactions;
CREATE TRIGGER trg_notify_on_reaction
  AFTER INSERT ON message_reactions
  FOR EACH ROW
  EXECUTE PROCEDURE public.fn_notify_on_reaction();

-- 8. Trigger Function: Notify on contact request & acceptance
CREATE OR REPLACE FUNCTION public.fn_notify_on_contact()
RETURNS trigger AS $$
DECLARE
  sender_prof RECORD;
  contact_prof RECORD;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Notify contact_id that user_id sent request
    SELECT id, display_name, username, avatar_url INTO sender_prof FROM profiles WHERE id = NEW.user_id;
    
    INSERT INTO notifications (
      user_id,
      actor_id,
      type,
      title,
      body,
      metadata,
      data,
      is_read,
      created_at
    ) VALUES (
      NEW.contact_id,
      NEW.user_id,
      'contact_request',
      'New Contact Request',
      COALESCE(sender_prof.display_name, sender_prof.username, 'Someone') || ' sent you a contact request',
      jsonb_build_object(
        'contact_id', NEW.id,
        'actor_id', NEW.user_id,
        'actor_name', COALESCE(sender_prof.display_name, sender_prof.username, 'User'),
        'avatar_url', sender_prof.avatar_url
      ),
      jsonb_build_object('contact_id', NEW.id),
      false,
      now()
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Notify original requester that request was accepted
    SELECT id, display_name, username, avatar_url INTO contact_prof FROM profiles WHERE id = NEW.contact_id;

    INSERT INTO notifications (
      user_id,
      actor_id,
      type,
      title,
      body,
      metadata,
      data,
      is_read,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.contact_id,
      'contact_accepted',
      'Contact Request Accepted',
      COALESCE(contact_prof.display_name, contact_prof.username, 'Someone') || ' accepted your contact request',
      jsonb_build_object(
        'contact_id', NEW.id,
        'actor_id', NEW.contact_id,
        'actor_name', COALESCE(contact_prof.display_name, contact_prof.username, 'User'),
        'avatar_url', contact_prof.avatar_url
      ),
      jsonb_build_object('contact_id', NEW.id),
      false,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_contact ON contacts;
CREATE TRIGGER trg_notify_on_contact
  AFTER INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE PROCEDURE public.fn_notify_on_contact();

-- 9. Trigger Function: Notify on missed calls
CREATE OR REPLACE FUNCTION public.fn_notify_on_missed_call()
RETURNS trigger AS $$
DECLARE
  caller_prof RECORD;
  part RECORD;
BEGIN
  IF NEW.status = 'missed' AND (OLD.status IS NULL OR OLD.status != 'missed') THEN
    SELECT id, display_name, username, avatar_url INTO caller_prof 
    FROM profiles WHERE id = NEW.caller_id;

    FOR part IN 
      SELECT user_id FROM call_participants WHERE call_id = NEW.id AND user_id != NEW.caller_id
    LOOP
      INSERT INTO notifications (
        user_id,
        actor_id,
        type,
        conversation_id,
        title,
        body,
        metadata,
        data,
        is_read,
        created_at
      ) VALUES (
        part.user_id,
        NEW.caller_id,
        'call_missed',
        NEW.conversation_id,
        'Missed ' || INITCAP(NEW.call_type) || ' Call',
        'Missed ' || NEW.call_type || ' call from ' || COALESCE(caller_prof.display_name, caller_prof.username, 'Someone'),
        jsonb_build_object(
          'call_id', NEW.id,
          'call_type', NEW.call_type,
          'conversation_id', NEW.conversation_id,
          'caller_id', NEW.caller_id,
          'caller_name', COALESCE(caller_prof.display_name, caller_prof.username, 'User'),
          'avatar_url', caller_prof.avatar_url
        ),
        jsonb_build_object('call_id', NEW.id, 'conversation_id', NEW.conversation_id),
        false,
        now()
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_missed_call ON calls;
CREATE TRIGGER trg_notify_on_missed_call
  AFTER UPDATE ON calls
  FOR EACH ROW
  EXECUTE PROCEDURE public.fn_notify_on_missed_call();

-- 10. Enable Supabase Realtime for notifications and devices safely
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE notification_devices;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
