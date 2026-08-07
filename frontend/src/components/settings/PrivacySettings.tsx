import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface PrivacyFormValues {
  lastSeen: string;
  profilePhoto: string;
  about: string;
  readReceipts: boolean;
  onlineStatus: boolean;
}

export const PrivacySettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { handleSubmit, setValue, watch, reset } = useForm<PrivacyFormValues>({
    defaultValues: {
      lastSeen: 'everyone',
      profilePhoto: 'everyone',
      about: 'everyone',
      readReceipts: true,
      onlineStatus: true,
    }
  });

  useEffect(() => {
    if (!user) return;
    const loadPrivacy = async () => {
      const { data } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        reset({
          lastSeen: data.last_seen || 'everyone',
          profilePhoto: data.profile_photo || 'everyone',
          about: data.about || 'everyone',
          readReceipts: data.read_receipts ?? true,
          onlineStatus: data.online_status ?? true,
        });
      }
    };
    loadPrivacy();
  }, [user, reset]);

  const onSubmit = async (data: PrivacyFormValues) => {
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('privacy_settings')
        .upsert({
          user_id: user.id,
          last_seen: data.lastSeen,
          profile_photo: data.profilePhoto,
          about: data.about,
          read_receipts: data.readReceipts,
          online_status: data.onlineStatus,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setMessage('Privacy settings saved successfully!');
    } catch (err: any) {
      setMessage(err.message || 'Failed to save privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const visibilityOptions = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'contacts', label: 'My Contacts' },
    { value: 'nobody', label: 'Nobody' },
  ];

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-zinc-100">Privacy Settings</h3>
        <p className="text-sm text-zinc-400">Manage who can see your personal info and status.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-sm font-medium text-zinc-200">Last Seen</label>
              <p className="text-xs text-zinc-500">Who can see when you were last online</p>
            </div>
            <Select 
              value={watch('lastSeen')} 
              onValueChange={(val) => val && setValue('lastSeen', val)}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-zinc-900 border-zinc-800 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                {visibilityOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="focus:bg-zinc-800">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-sm font-medium text-zinc-200">Profile Photo</label>
              <p className="text-xs text-zinc-500">Who can see your profile picture</p>
            </div>
            <Select 
              value={watch('profilePhoto')} 
              onValueChange={(val) => val && setValue('profilePhoto', val)}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-zinc-900 border-zinc-800 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                {visibilityOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="focus:bg-zinc-800">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-sm font-medium text-zinc-200">About</label>
              <p className="text-xs text-zinc-500">Who can see your about bio</p>
            </div>
            <Select 
              value={watch('about')} 
              onValueChange={(val) => val && setValue('about', val)}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-zinc-900 border-zinc-800 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                {visibilityOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="focus:bg-zinc-800">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-px bg-zinc-800 my-4" />

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-zinc-200">Read Receipts</label>
              <p className="text-xs text-zinc-500">If turned off, you won't send or receive read receipts</p>
            </div>
            <Switch 
              checked={watch('readReceipts')}
              onCheckedChange={(val) => setValue('readReceipts', val)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-zinc-200">Online Status</label>
              <p className="text-xs text-zinc-500">Show when you are currently active</p>
            </div>
            <Switch 
              checked={watch('onlineStatus')}
              onCheckedChange={(val) => setValue('onlineStatus', val)}
            />
          </div>
        </div>

        {message && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};
