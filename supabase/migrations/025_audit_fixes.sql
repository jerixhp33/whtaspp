-- Migration 025: Audit Fixes
-- Handles Bug 13, Bug 14, and Bug 15 from the codebase audit.

-- ==============================================================================
-- Bug 13: Notifications INSERT Policy
-- ==============================================================================
-- Allows users to insert their own notifications locally.
CREATE POLICY "Users can insert own notifications" ON notifications 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- Bug 14: Create blocked_users table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Prevent duplicate blocks
  UNIQUE(user_id, blocked_user_id)
);

-- Enable RLS on blocked_users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Blocked users policies
CREATE POLICY "Users can view own blocked users" ON blocked_users 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blocked users" ON blocked_users 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own blocked users" ON blocked_users 
FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for fast lookup
CREATE INDEX idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);

-- ==============================================================================
-- Bug 15: Add conversation_id to reports
-- ==============================================================================
-- Check if conversation_id column exists, if not, add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='conversation_id') THEN
        ALTER TABLE reports ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
        CREATE INDEX idx_reports_conversation_id ON reports(conversation_id);
    END IF;
END
$$;
