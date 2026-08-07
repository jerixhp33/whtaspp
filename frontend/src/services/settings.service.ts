import { supabase } from '../lib/supabase';

export const settingsService = {
  getUserSettings: async () => supabase.from('user_settings').select('*').single(),
  updateUserSettings: async (updates: any) => supabase.from('user_settings').update(updates),
  getPrivacySettings: async () => supabase.from('privacy_settings').select('*').single(),
  updatePrivacySettings: async (updates: any) => supabase.from('privacy_settings').update(updates)
};
