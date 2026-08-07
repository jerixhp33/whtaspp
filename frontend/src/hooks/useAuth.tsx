import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: any;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (sessionUser: any) => {
    if (!sessionUser?.id) return;
    try {
      let { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      const metaAvatar = sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || null;
      const metaName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.display_name || sessionUser.user_metadata?.name || null;
      const email = sessionUser.email || '';
      const baseUsername = email.split('@')[0] || `user_${sessionUser.id.substring(0, 5)}`;

      if (!data) {
        const newProfile = {
          id: sessionUser.id,
          username: baseUsername,
          display_name: metaName || baseUsername,
          email: email,
          avatar_url: metaAvatar,
        };

        const { data: createdData } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .maybeSingle();

        if (createdData) data = createdData;
      } else {
        // Auto-sync Google OAuth avatar or name if missing
        if ((!data.avatar_url && metaAvatar) || (data.display_name === data.username && metaName)) {
          const updates: any = {};
          if (!data.avatar_url && metaAvatar) updates.avatar_url = metaAvatar;
          if (data.display_name === data.username && metaName) updates.display_name = metaName;

          const { data: updated } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', sessionUser.id)
            .select()
            .maybeSingle();

          if (updated) data = updated;
        }
      }
        
      if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
