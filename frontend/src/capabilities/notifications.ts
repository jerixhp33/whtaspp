export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export const notificationsCapability = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  async getStatus(): Promise<PermissionState> {
    if (!this.isSupported()) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'prompt';
  },

  async request(): Promise<PermissionState> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') return 'granted';
      if (res === 'denied') return 'denied';
      return 'prompt';
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
      return 'denied';
    }
  }
};
