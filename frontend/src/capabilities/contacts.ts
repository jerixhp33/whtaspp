import { Contacts } from '@capacitor-community/contacts';
import { platform } from './platform';
import { PermissionState } from './notifications';

export interface PhoneContactItem {
  name?: string;
  phones?: string[];
  emails?: string[];
}

export const contactsCapability = {
  isSupported(): boolean {
    if (platform.isCapacitor()) return true;
    return typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;
  },

  async getStatus(): Promise<PermissionState> {
    if (platform.isCapacitor()) {
      try {
        const perm = await Contacts.checkPermissions();
        if (perm.contacts === 'granted') return 'granted';
        if (perm.contacts === 'denied') return 'denied';
        return 'prompt';
      } catch (err) {
        console.warn('Capacitor checkPermissions error:', err);
        return 'prompt';
      }
    }

    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      return 'prompt';
    }

    return 'unsupported';
  },

  async request(): Promise<PermissionState> {
    if (platform.isCapacitor()) {
      try {
        const perm = await Contacts.requestPermissions();
        if (perm.contacts === 'granted') return 'granted';
        if (perm.contacts === 'denied') return 'denied';
        return 'prompt';
      } catch (err) {
        console.warn('Capacitor requestPermissions error:', err);
        return 'denied';
      }
    }

    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      try {
        // Trigger contact picker to check browser permission
        const props = ['name', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: true });
        if (contacts && contacts.length > 0) return 'granted';
        return 'prompt';
      } catch (err) {
        return 'denied';
      }
    }

    return 'unsupported';
  },

  async readContacts(): Promise<PhoneContactItem[]> {
    if (platform.isCapacitor()) {
      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
          emails: true,
        },
      });

      return (result.contacts || []).map((c: any) => ({
        name: c.name?.display || `${c.name?.given || ''} ${c.name?.family || ''}`.trim() || 'Unnamed',
        phones: (c.phones || []).map((p: any) => p.number).filter(Boolean),
        emails: (c.emails || []).map((e: any) => e.address).filter(Boolean),
      }));
    }

    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      const props = ['name', 'tel', 'email'];
      const raw = await (navigator as any).contacts.select(props, { multiple: true });
      return (raw || []).map((c: any) => ({
        name: (c.name && c.name[0]) || 'Unnamed',
        phones: c.tel || [],
        emails: c.email || [],
      }));
    }

    return [];
  }
};
