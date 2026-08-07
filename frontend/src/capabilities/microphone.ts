import { PermissionState } from './notifications';

export const microphoneCapability = {
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  },

  async getStatus(): Promise<PermissionState> {
    if (!this.isSupported()) return 'unsupported';
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      try {
        const res = await navigator.permissions.query({ name: 'microphone' as any });
        return res.state as PermissionState;
      } catch (_) {}
    }
    return 'prompt';
  },

  async request(): Promise<PermissionState> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return 'granted';
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return 'denied';
      }
      return 'prompt';
    }
  }
};
