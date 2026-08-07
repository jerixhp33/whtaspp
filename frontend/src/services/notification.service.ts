import { supabase } from '../lib/supabase';
import type { Notification } from '../types';

// Stable device fingerprint for push registration
function getDeviceId(): string {
  let deviceId = localStorage.getItem('chatflow_device_id');
  if (!deviceId) {
    deviceId = 'web_' + crypto.randomUUID();
    localStorage.setItem('chatflow_device_id', deviceId);
  }
  return deviceId;
}

// Web Audio API notification chime (no external audio files)
let audioCtx: AudioContext | null = null;

function playNotificationSound(): void {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const ctx = audioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    // First tone: C5 (523 Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523, now);
    osc1.connect(gainNode);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Second tone: E5 (659 Hz)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659, now + 0.1);
    const gain2 = ctx.createGain();
    gain2.connect(ctx.destination);
    gain2.gain.setValueAtTime(0.12, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.connect(gain2);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.2);
  } catch {
    // Audio not available
  }
}

export const notificationService = {
  getDeviceId,
  playNotificationSound,

  // Fetch paginated notifications
  getNotifications: async (userId: string, limit = 30, offset = 0) => {
    return supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
  },

  // Get unread count
  getUnreadCount: async (userId: string) => {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return count || 0;
  },

  // Mark single notification as read
  markAsRead: async (id: string) => {
    return supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
  },

  // Mark all notifications as read for user
  markAllAsRead: async (userId: string) => {
    return supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
  },

  // Clear notification history
  clearNotifications: async (userId: string, readOnly = false) => {
    let query = supabase.from('notifications').delete().eq('user_id', userId);
    if (readOnly) query = query.eq('is_read', true);
    return query;
  },

  // Register device for push notifications
  registerDevice: async (
    userId: string,
    platform: string,
    deviceId: string,
    subscription?: { endpoint: string; keys: { p256dh: string; auth: string } }
  ) => {
    const data: Record<string, any> = {
      user_id: userId,
      platform,
      device_id: deviceId,
      is_active: true,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (subscription) {
      data.endpoint = subscription.endpoint;
      data.public_key = subscription.keys.p256dh;
      data.auth_key = subscription.keys.auth;
    }
    return supabase
      .from('notification_devices')
      .upsert(data, { onConflict: 'user_id,platform,device_id' });
  },

  // Unregister device
  unregisterDevice: async (userId: string, deviceId: string) => {
    return supabase
      .from('notification_devices')
      .delete()
      .eq('user_id', userId)
      .eq('device_id', deviceId);
  },

  // Request browser notification permission
  requestBrowserPermission: async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  // Send a native browser notification
  sendBrowserNotification: (title: string, body?: string, data?: Record<string, any>) => {
    if (Notification.permission !== 'granted') return;
    const notif = new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `chatflow-${data?.type || 'notification'}`,
      data,
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
      if (data?.conversation_id) {
        window.location.href = `/?conversation=${data.conversation_id}${data.message_id ? `&message=${data.message_id}` : ''}`;
      }
    };
  },

  // Subscribe to Web Push via service worker
  subscribeToPush: async (userId: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        // In production, use VAPID public key from environment:
        // const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        // subscription = await registration.pushManager.subscribe({
        //   userVisibleOnly: true,
        //   applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        // });
        return null; // VAPID key not configured yet
      }
      const json = subscription.toJSON();
      if (json.endpoint && json.keys) {
        await notificationService.registerDevice(userId, 'web', getDeviceId(), {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh!, auth: json.keys.auth! }
        });
      }
      return subscription;
    } catch (err) {
      console.error('Failed to subscribe to push:', err);
      return null;
    }
  },
};
