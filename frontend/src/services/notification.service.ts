import { supabase } from '../lib/supabase';

export const notificationService = {
  getNotifications: async () => supabase.from('notifications').select('*').order('created_at', { ascending: false }),
  markAsRead: async (id: string) => supabase.from('notifications').update({ is_read: true }).eq('id', id),
  markAllAsRead: async () => supabase.from('notifications').update({ is_read: true }).eq('is_read', false),
  requestBrowserPermission: async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },
  sendBrowserNotification: (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }
};
