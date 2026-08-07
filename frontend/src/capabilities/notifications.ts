export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export const notificationsCapability = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  async getStatus(): Promise<PermissionState> {
    if (!this.isSupported()) return 'unsupported';
    if (Notification.permission === 'granted') {
      localStorage.setItem('chatflow_perm_notif', 'granted');
      return 'granted';
    }
    if (Notification.permission === 'denied') {
      localStorage.setItem('chatflow_perm_notif', 'denied');
      return 'denied';
    }
    return 'prompt';
  },

  async request(): Promise<PermissionState> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        localStorage.setItem('chatflow_perm_notif', 'granted');
        return 'granted';
      }
      if (res === 'denied') {
        localStorage.setItem('chatflow_perm_notif', 'denied');
        return 'denied';
      }
      return 'prompt';
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
      return 'denied';
    }
  }
};
