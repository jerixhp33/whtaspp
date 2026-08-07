import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2 } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    master: true,
    sound: true,
    preview: true,
    messages: true,
    mentions: true,
    calls: true,
    requests: true,
    groupActivity: false
  });

  useEffect(() => {
    if (!user) return;
    const loadSettings = async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings(prev => ({
          ...prev,
          master: data.notifications_enabled ?? true,
          sound: data.notification_sound ?? true,
          preview: data.message_preview ?? true,
        }));
      }
    };
    loadSettings();
  }, [user]);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRequestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setMessage('Browser notification permission granted!');
        } else {
          setMessage('Browser notification permission denied.');
        }
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notifications_enabled: settings.master,
          notification_sound: settings.sound,
          message_preview: settings.preview,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setMessage('Notification settings saved successfully!');
    } catch (err: any) {
      setMessage(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-zinc-100">Notifications</h3>
          <p className="text-sm text-zinc-400">Manage how you receive notifications.</p>
        </div>
        <Switch 
          checked={settings.master}
          onCheckedChange={() => toggleSetting('master')}
        />
      </div>

      <div className={`space-y-8 ${!settings.master ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-zinc-200">Browser Notifications</h4>
            <p className="text-xs text-zinc-500">Allow ChatFlow to send desktop notifications</p>
          </div>
          <Button variant="outline" onClick={handleRequestPermission} className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">
            Request Permission
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-zinc-200">Notification Sound</label>
              <p className="text-xs text-zinc-500">Play a sound for incoming messages</p>
            </div>
            <Switch checked={settings.sound} onCheckedChange={() => toggleSetting('sound')} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-zinc-200">Message Preview</label>
              <p className="text-xs text-zinc-500">Show message text in notifications</p>
            </div>
            <Switch checked={settings.preview} onCheckedChange={() => toggleSetting('preview')} />
          </div>
          
          <div className="h-px bg-zinc-800 my-4" />
          
          <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Notify me about</h4>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-200">New Messages</label>
            <Switch checked={settings.messages} onCheckedChange={() => toggleSetting('messages')} />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-200">Mentions (@username)</label>
            <Switch checked={settings.mentions} onCheckedChange={() => toggleSetting('mentions')} />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-200">Incoming Calls</label>
            <Switch checked={settings.calls} onCheckedChange={() => toggleSetting('calls')} />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-200">Contact Requests</label>
            <Switch checked={settings.requests} onCheckedChange={() => toggleSetting('requests')} />
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
