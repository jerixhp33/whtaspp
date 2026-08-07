import React, { useState, useEffect } from 'react';
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

export const AppearanceSettings: React.FC = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [enterToSend, setEnterToSend] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadSettings = async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setTheme(data.theme || 'dark');
        setLanguage(data.language || 'en');
        setEnterToSend(data.enter_to_send ?? true);
        setAutoDownload(data.media_auto_download ?? false);
      }
    };
    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          theme,
          language,
          enter_to_send: enterToSend,
          media_auto_download: autoDownload,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setMessage('Appearance & chat settings saved!');
    } catch (err: any) {
      setMessage(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-zinc-100">Appearance & Chat</h3>
        <p className="text-sm text-zinc-400">Customize how ChatFlow looks and behaves.</p>
      </div>

      <div className="space-y-8">
        <div>
          <h4 className="text-sm font-medium text-zinc-300 mb-4">Theme</h4>
          <Select value={theme} onValueChange={(val) => val && setTheme(val)}>
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectItem value="dark" className="focus:bg-zinc-800">Dark (Default)</SelectItem>
              <SelectItem value="light" className="focus:bg-zinc-800">Light</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-zinc-200">Language</label>
            <p className="text-xs text-zinc-500">Select application language</p>
          </div>
          <Select value={language} onValueChange={(val) => val && setLanguage(val)}>
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectItem value="en" className="focus:bg-zinc-800">English</SelectItem>
              <SelectItem value="es" className="focus:bg-zinc-800">Español</SelectItem>
              <SelectItem value="fr" className="focus:bg-zinc-800">Français</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="h-px bg-zinc-800 my-4" />

        <h4 className="text-sm font-medium text-zinc-300 mb-4">Chat Settings</h4>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-zinc-200">Enter to Send</label>
              <p className="text-xs text-zinc-500">Pressing Enter will send the message instead of creating a new line</p>
            </div>
            <Switch checked={enterToSend} onCheckedChange={setEnterToSend} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-zinc-200">Media Auto-Download</label>
              <p className="text-xs text-zinc-500">Automatically download incoming images and files</p>
            </div>
            <Switch checked={autoDownload} onCheckedChange={setAutoDownload} />
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-6 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      <div className="flex justify-end pt-6">
        <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};
