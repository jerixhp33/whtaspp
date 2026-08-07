import { PermissionState } from './notifications';

export const microphoneCapability = {
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  },

  async getStatus(): Promise<PermissionState> {
    if (!this.isSupported()) return 'unsupported';

    // 1. Check persistent localStorage cache
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('chatflow_perm_mic') : null;
    if (cached === 'granted') return 'granted';
    if (cached === 'denied') return 'denied';

    // 2. Enumerate devices - if label is present, permission is active
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioWithLabel = devices.some(d => d.kind === 'audioinput' && d.label.length > 0);
        if (hasAudioWithLabel) {
          localStorage.setItem('chatflow_perm_mic', 'granted');
          return 'granted';
        }
      }
    } catch (_) {}

    // 3. Permissions API check (supported in some Chromium browsers)
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const res = await navigator.permissions.query({ name: 'microphone' as any });
        if (res.state === 'granted') {
          localStorage.setItem('chatflow_perm_mic', 'granted');
          return 'granted';
        }
        if (res.state === 'denied') {
          localStorage.setItem('chatflow_perm_mic', 'denied');
          return 'denied';
        }
        return 'prompt';
      } catch (_) {}
    }

    return 'prompt';
  },

  async request(): Promise<PermissionState> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      localStorage.setItem('chatflow_perm_mic', 'granted');
      return 'granted';
    } catch (err: any) {
      console.warn('Microphone permission request result:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        localStorage.setItem('chatflow_perm_mic', 'denied');
        return 'denied';
      }
      return 'prompt';
    }
  }
};
