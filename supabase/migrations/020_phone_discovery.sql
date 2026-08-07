-- Phone discovery columns for privacy-first phone contact matching
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number_normalized TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_discoverable BOOLEAN DEFAULT true;

-- Index on normalized phone numbers for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_phone_normalized ON profiles(phone_number_normalized) WHERE phone_discoverable = true;

-- Backfill phone_number_normalized from phone column where present
UPDATE profiles 
SET phone_number_normalized = REGEXP_REPLACE(phone, '[^0-9+]', '', 'g')
WHERE phone IS NOT NULL AND (phone_number_normalized IS NULL OR phone_number_normalized = '');
