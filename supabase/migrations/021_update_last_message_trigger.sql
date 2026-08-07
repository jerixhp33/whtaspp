-- Postgres trigger to automatically update conversations last_message_id and last_message_at on message insert
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_id = NEW.id,
      last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;

CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Backfill last_message_id for all existing conversations with messages
UPDATE conversations c
SET last_message_id = m.id,
    last_message_at = m.created_at
FROM (
  SELECT DISTINCT ON (conversation_id) id, conversation_id, created_at
  FROM messages
  ORDER BY conversation_id, created_at DESC
) m
WHERE c.id = m.conversation_id;
