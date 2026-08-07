import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AvatarUpload } from './AvatarUpload';
import { Loader2, CheckCircle2 } from 'lucide-react';

export function ProfileEdit() {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [status, setStatus] = useState(profile?.status || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setStatus(profile.status || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;
      await refreshProfile();
      setMessage('Avatar updated successfully!');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Failed to upload avatar');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          username,
          bio,
          status,
          phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setMessage(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Public Profile</h2>
        <p className="text-sm text-zinc-400">Manage how others see you on ChatFlow.</p>
      </div>

      <div className="flex items-center gap-6 mb-8 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <AvatarUpload currentAvatarUrl={profile?.avatar_url} onUpload={handleAvatarUpload} />
        <div>
          <h3 className="font-semibold text-white text-lg">{profile?.display_name || profile?.username || 'User'}</h3>
          <p className="text-sm text-emerald-400">@{profile?.username}</p>
          <p className="text-xs text-zinc-500 mt-1">Click avatar image to upload a new picture</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Display Name</label>
          <Input 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)} 
            placeholder="Your name" 
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Username</label>
          <Input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="username" 
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Status Message</label>
          <Input 
            value={status} 
            onChange={(e) => setStatus(e.target.value)} 
            placeholder="Hey, I am using ChatFlow!" 
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Bio</label>
          <Textarea 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
            placeholder="Tell us a little bit about yourself..." 
            className="bg-zinc-900 border-zinc-800 text-zinc-100 resize-none h-24"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Phone Number</label>
          <Input 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            placeholder="+1 234 567 8900" 
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
        </div>

        {message && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
