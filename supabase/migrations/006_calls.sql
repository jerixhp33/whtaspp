CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  caller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  call_type TEXT CHECK (call_type IN ('voice','video')) NOT NULL,
  status TEXT CHECK (status IN ('initiating','ringing','active','ended','missed','rejected','busy')) DEFAULT 'initiating',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,
  is_camera_off BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('invited','ringing','joined','left','rejected')) DEFAULT 'invited',
  UNIQUE(call_id, user_id)
);
