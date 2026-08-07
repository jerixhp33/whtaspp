import { supabase } from '../lib/supabase';

export const authService = {
  signUp: async (email: string, password: string) => supabase.auth.signUp({ email, password }),
  signIn: async (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
  signInWithGoogle: async () => supabase.auth.signInWithOAuth({ provider: 'google' }),
  signOut: async () => supabase.auth.signOut(),
  resetPassword: async (email: string) => supabase.auth.resetPasswordForEmail(email),
  updatePassword: async (password: string) => supabase.auth.updateUser({ password }),
  getSession: async () => supabase.auth.getSession(),
  onAuthStateChange: (callback: (event: any, session: any) => void) => supabase.auth.onAuthStateChange(callback)
};
