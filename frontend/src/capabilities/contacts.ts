import { Contacts } from '@capacitor-community/contacts';
import { platform } from './platform';
import { PermissionState } from './notifications';

export interface PhoneContactItem {
  id?: string;
  name?: string;
  phones?: string[];
  emails?: string[];
}

export const contactsCapability = {
  isSupported(): boolean {
    return true;
  },

  async getStatus(): Promise<PermissionState> {
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('chatflow_perm_contacts') : null;
    if (cached === 'granted') return 'granted';
    if (cached === 'denied') return 'denied';

    if (platform.isCapacitor()) {
      try {
        const perm = await Contacts.checkPermissions();
        if (perm.contacts === 'granted') {
          localStorage.setItem('chatflow_perm_contacts', 'granted');
          return 'granted';
        }
        if (perm.contacts === 'denied') {
          localStorage.setItem('chatflow_perm_contacts', 'denied');
          return 'denied';
        }
      } catch (err) {
        console.warn('Capacitor checkPermissions error:', err);
      }
    }

    return 'prompt';
  },

  async request(): Promise<PermissionState> {
    if (platform.isCapacitor()) {
      try {
        const perm = await Contacts.requestPermissions();
        if (perm.contacts === 'granted') {
          localStorage.setItem('chatflow_perm_contacts', 'granted');
          return 'granted';
        }
        if (perm.contacts === 'denied') {
          localStorage.setItem('chatflow_perm_contacts', 'denied');
          return 'denied';
        }
      } catch (err) {
        console.warn('Capacitor requestPermissions error:', err);
      }
    }

    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: true });
        if (contacts && contacts.length > 0) {
          localStorage.setItem('chatflow_perm_contacts', 'granted');
          return 'granted';
        }
      } catch (err) {
        console.warn('Web contact picker error:', err);
      }
    }

    // Web / Desktop fallback: enable contact discovery mode
    localStorage.setItem('chatflow_perm_contacts', 'granted');
    return 'granted';
  },

  async readContacts(): Promise<PhoneContactItem[]> {
    // 1. Capacitor Native Android
    if (platform.isCapacitor()) {
      try {
        const result = await Contacts.getContacts({
          projection: {
            name: true,
            phones: true,
            emails: true,
          },
        });

        if (result.contacts && result.contacts.length > 0) {
          return result.contacts.map((c: any) => ({
            id: c.contactId || c.lookupKey || Math.random().toString(36),
            name: c.name?.display || `${c.name?.given || ''} ${c.name?.family || ''}`.trim() || 'Unnamed',
            phones: (c.phones || []).map((p: any) => p.number).filter(Boolean),
            emails: (c.emails || []).map((e: any) => e.address).filter(Boolean),
          }));
        }
      } catch (err) {
        console.warn('Capacitor getContacts error:', err);
      }
    }

    // 2. Web Contact Picker API
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel', 'email'];
        const raw = await (navigator as any).contacts.select(props, { multiple: true });
        if (raw && raw.length > 0) {
          return raw.map((c: any, idx: number) => ({
            id: `web-contact-${idx}`,
            name: (c.name && c.name[0]) || 'Unnamed',
            phones: c.tel || [],
            emails: c.email || [],
          }));
        }
      } catch (err) {
        console.warn('Web contact select error:', err);
      }
    }

    // 3. User-added local phone contacts from localStorage
    try {
      const saved = localStorage.getItem('chatflow_custom_contacts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}

    return [];
  },

  addCustomContact(name: string, phone: string) {
    try {
      const saved = localStorage.getItem('chatflow_custom_contacts');
      const list: PhoneContactItem[] = saved ? JSON.parse(saved) : [];
      const newContact: PhoneContactItem = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        phones: [phone.trim()]
      };
      list.push(newContact);
      localStorage.setItem('chatflow_custom_contacts', JSON.stringify(list));
      localStorage.setItem('chatflow_perm_contacts', 'granted');
      return list;
    } catch (err) {
      console.warn('Failed to save custom contact:', err);
      return [];
    }
  }
};
