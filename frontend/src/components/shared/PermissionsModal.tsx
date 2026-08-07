import { useState } from 'react';
import { Bell, Camera, Mic, Users, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PermissionsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notificationGranted, setNotificationGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [mediaGranted, setMediaGranted] = useState(false);
  const [contactsGranted, setContactsGranted] = useState(true);

  if (!isOpen) return null;

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        if (res === 'granted') setNotificationGranted(true);
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
  };

  const handleRequestMedia = async () => {
    try {
      // Request audio & video with fallback
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (camErr) {
        // Fallback to audio only if webcam is not present or blocked
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      stream.getTracks().forEach((track) => track.stop());
      setMediaGranted(true);
    } catch (err) {
      console.error('Media permission denied:', err);
      alert('Microphone/Camera permission denied. Please enable them in your browser site settings.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 text-zinc-100 flex flex-col space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">App Permissions</h2>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Enable permissions for real-time notifications, HD voice & video calls, and contact discovery in ChatFlow.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Push Notifications</p>
                <p className="text-xs text-zinc-500">Alerts for new messages & incoming calls</p>
              </div>
            </div>
            {notificationGranted ? (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Allowed
              </span>
            ) : (
              <Button size="sm" onClick={handleRequestNotification} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Allow
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Camera & Microphone</p>
                <p className="text-xs text-zinc-500">For WebRTC voice and video calls</p>
              </div>
            </div>
            {mediaGranted ? (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Allowed
              </span>
            ) : (
              <Button size="sm" onClick={handleRequestMedia} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Allow
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Contacts Sync</p>
                <p className="text-xs text-zinc-500">Discover friends on ChatFlow</p>
              </div>
            </div>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Enabled
            </span>
          </div>
        </div>

        <Button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
          Continue to ChatFlow
        </Button>
      </div>
    </div>
  );
}
