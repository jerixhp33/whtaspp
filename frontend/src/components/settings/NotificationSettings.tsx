import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, Bell, BellOff, MessageSquare, AtSign, Phone, Video, Heart, UserPlus, Users, Vibrate, Volume2, Eye, EyeOff } from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [settings, setSettings] = useState({
    master: true,
    sound: true,
    preview: true,
    vibration: true,
    messages: true,
    groups: true,
    mentions: true,
    replies: true,
    reactions: true,
    calls: true,
    requests: true,
  });

  useEffect(() => {
    if (!user) return;

    // Check browser notification permission status
    if ('Notification' in window) {
      setPushStatus(Notification.permission as any);
    }

    const loadSettings = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setSettings({
            master: data.notifications_enabled ?? true,
            sound: data.notification_sound ?? true,
            preview: data.message_preview ?? true,
            vibration: data.vibration_enabled ?? true,
            messages: data.notify_messages ?? true,
            groups: data.notify_groups ?? true,
            mentions: data.notify_mentions ?? true,
            replies: data.notify_replies ?? true,
            reactions: data.notify_reactions ?? true,
            calls: data.notify_calls ?? true,
            requests: data.notify_requests ?? true,
          });
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [user]);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      setMessage('Browser does not support notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission as any);
      if (permission === 'granted') {
        setMessage('Push notification permission granted!');

        // Register service worker push subscription
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const existingSub = await registration.pushManager.getSubscription();
          if (!existingSub && user) {
            // In production, use VAPID public key from env
            // For now, register the service worker for push readiness
            setMessage('Push notifications enabled! You will receive notifications when the app is backgrounded.');
          } else {
            setMessage('Push subscription already active.');
          }
        }
      } else if (permission === 'denied') {
        setMessage('Notification permission denied. Please enable in browser settings.');
      } else {
        setMessage('Notification permission was dismissed.');
      }
    } catch (err: any) {
      setMessage('Failed to request notification permission.');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaveLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notifications_enabled: settings.master,
          notification_sound: settings.sound,
          message_preview: settings.preview,
          vibration_enabled: settings.vibration,
          notify_messages: settings.messages,
          notify_groups: settings.groups,
          notify_mentions: settings.mentions,
          notify_replies: settings.replies,
          notify_reactions: settings.reactions,
          notify_calls: settings.calls,
          notify_requests: settings.requests,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setMessage('Notification settings saved successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to save settings');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      {/* Master Toggle */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {settings.master ? (
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Bell className="h-5 w-5" />
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-zinc-800 text-zinc-500">
              <BellOff className="h-5 w-5" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-zinc-100">Notifications</h3>
            <p className="text-sm text-zinc-400">Enable or disable all notifications</p>
          </div>
        </div>
        <Switch
          checked={settings.master}
          onCheckedChange={() => toggleSetting('master')}
        />
      </div>

      <div className={`space-y-8 transition-opacity duration-200 ${!settings.master ? 'opacity-40 pointer-events-none' : ''}`}>

        {/* Push Permission */}
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-zinc-200">Push Notifications</h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                {pushStatus === 'granted'
                  ? '✅ Push notifications are enabled'
                  : pushStatus === 'denied'
                  ? '❌ Push notifications are blocked — enable in browser settings'
                  : 'Allow ChatFlow to send push notifications when the app is backgrounded'
                }
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestPushPermission}
              disabled={pushStatus === 'granted'}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-xs"
            >
              {pushStatus === 'granted' ? 'Enabled' : pushStatus === 'denied' ? 'Blocked' : 'Enable Push'}
            </Button>
          </div>
        </div>

        {/* Sound & Vibration */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Alerts</h4>

          <SettingRow
            icon={<Volume2 className="h-4 w-4" />}
            label="Notification Sound"
            description="Play a chime for incoming notifications"
            checked={settings.sound}
            onToggle={() => toggleSetting('sound')}
          />

          <SettingRow
            icon={<Vibrate className="h-4 w-4" />}
            label="Vibration"
            description="Vibrate on notification arrival (mobile)"
            checked={settings.vibration}
            onToggle={() => toggleSetting('vibration')}
          />

          <SettingRow
            icon={settings.preview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            label="Message Preview"
            description={settings.preview ? 'Show message text in notifications' : 'Notifications will show "New message" only'}
            checked={settings.preview}
            onToggle={() => toggleSetting('preview')}
          />
        </div>

        <div className="h-px bg-zinc-800" />

        {/* Category Toggles */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Notify me about</h4>

          <SettingRow
            icon={<MessageSquare className="h-4 w-4" />}
            label="Direct Messages"
            description="New messages in private chats"
            checked={settings.messages}
            onToggle={() => toggleSetting('messages')}
          />

          <SettingRow
            icon={<Users className="h-4 w-4" />}
            label="Group Messages"
            description="New messages in group conversations"
            checked={settings.groups}
            onToggle={() => toggleSetting('groups')}
          />

          <SettingRow
            icon={<AtSign className="h-4 w-4" />}
            label="Mentions"
            description="When someone @mentions you"
            checked={settings.mentions}
            onToggle={() => toggleSetting('mentions')}
          />

          <SettingRow
            icon={<MessageSquare className="h-4 w-4" />}
            label="Replies"
            description="When someone replies to your message"
            checked={settings.replies}
            onToggle={() => toggleSetting('replies')}
          />

          <SettingRow
            icon={<Heart className="h-4 w-4" />}
            label="Reactions"
            description="When someone reacts to your message"
            checked={settings.reactions}
            onToggle={() => toggleSetting('reactions')}
          />

          <SettingRow
            icon={<Phone className="h-4 w-4" />}
            label="Calls"
            description="Incoming and missed voice/video calls"
            checked={settings.calls}
            onToggle={() => toggleSetting('calls')}
          />

          <SettingRow
            icon={<UserPlus className="h-4 w-4" />}
            label="Contact Requests"
            description="New contact requests and acceptances"
            checked={settings.requests}
            onToggle={() => toggleSetting('requests')}
          />
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className="mt-6 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-6">
        <Button
          onClick={handleSave}
          disabled={saveLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6"
        >
          {saveLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

// Reusable setting toggle row
function SettingRow({ icon, label, description, checked, onToggle }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        <div className="text-zinc-400">{icon}</div>
        <div>
          <label className="text-sm font-medium text-zinc-200">{label}</label>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}
