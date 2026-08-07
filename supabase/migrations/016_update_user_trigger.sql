-- Update handle_new_user function to capture full_name, avatar_url, and name from OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username TEXT;
  new_username TEXT;
  raw_avatar TEXT;
  raw_name TEXT;
BEGIN
  -- Extract part before @ from email
  base_username := split_part(NEW.email, '@', 1);
  new_username := base_username;
  
  -- Make sure username is unique
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    new_username := base_username || '_' || substr(md5(random()::text), 1, 4);
  END LOOP;

  -- Extract OAuth avatar and name metadata if present
  raw_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  raw_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    new_username
  );

  INSERT INTO public.profiles (id, username, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    new_username,
    raw_name,
    NEW.email,
    raw_avatar
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    display_name = CASE WHEN public.profiles.display_name = '' OR public.profiles.display_name IS NULL THEN EXCLUDED.display_name ELSE public.profiles.display_name END,
    email = EXCLUDED.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
