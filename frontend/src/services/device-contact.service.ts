import { Contacts } from '@capacitor-community/contacts';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export interface DeviceContact {
  id: string;
  name: string;
  phoneNumbers: string[];
}

export interface MatchedPhoneContact {
  deviceContact: DeviceContact;
  profile?: Profile;
  isOnChatFlow: boolean;
  primaryPhone: string;
}

export interface PhoneContactsResult {
  onChatFlow: MatchedPhoneContact[];
  inviteToChatFlow: MatchedPhoneContact[];
}

export class DeviceContactService {
  /**
   * Check if contacts permission is granted
   */
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      if ('Contacts' in window || (window as any).Capacitor?.isPluginAvailable('Contacts')) {
        const res = await Contacts.checkPermissions();
        if (res.contacts === 'granted') return 'granted';
        if (res.contacts === 'denied') return 'denied';
        return 'prompt';
      }

      // Web Contact Picker API check
      if ('contacts' in navigator && 'ContactsManager' in window) {
        return 'prompt';
      }

      return 'denied';
    } catch (err) {
      console.warn('Check contacts permission fallback:', err);
      return 'prompt';
    }
  }

  /**
   * Request contacts permission from OS
   */
  async requestPermission(): Promise<boolean> {
    try {
      if ((window as any).Capacitor?.isPluginAvailable('Contacts')) {
        const res = await Contacts.requestPermissions();
        return res.contacts === 'granted';
      }

      if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
        return true;
      }

      return false;
    } catch (err) {
      console.error('Request contacts permission error:', err);
      return false;
    }
  }

  /**
   * Read contacts from device address book
   */
  async getDeviceContacts(): Promise<DeviceContact[]> {
    try {
      // 1. Try Capacitor native Contacts plugin
      if ((window as any).Capacitor?.isPluginAvailable('Contacts')) {
        const result = await Contacts.getContacts({
          projection: {
            name: true,
            phones: true,
          }
        });

        if (result.contacts) {
          return result.contacts.map((c: any) => ({
            id: c.contactId || c.lookupKey || Math.random().toString(36),
            name: c.name?.display || c.name?.given || c.displayName || 'Unknown Contact',
            phoneNumbers: c.phones?.map((p: any) => p.number).filter(Boolean) as string[] || [],
          })).filter(c => c.phoneNumbers.length > 0);
        }
      }

      // 2. Web Contact Picker API fallback
      if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
        const selected = await (navigator as any).contacts.select(['name', 'tel'], { multiple: true });
        if (selected && selected.length > 0) {
          return selected.map((c: any, idx: number) => ({
            id: `web-contact-${idx}`,
            name: c.name?.[0] || 'Unknown Contact',
            phoneNumbers: c.tel || [],
          })).filter((c: DeviceContact) => c.phoneNumbers.length > 0);
        }
      }

      return [];
    } catch (err) {
      console.error('Failed to get device contacts:', err);
      return [];
    }
  }

  /**
   * Normalize phone number to E.164 (+919876543210) using libphonenumber-js
   */
  normalizePhoneNumber(phoneStr: string, defaultCountry: any = 'IN'): string | null {
    if (!phoneStr) return null;
    try {
      // Remove whitespace/dashes
      const cleaned = phoneStr.trim();
      const parsed = parsePhoneNumberFromString(cleaned, defaultCountry);
      if (parsed && parsed.isValid()) {
        return parsed.format('E.164');
      }

      // Fallback regex normalization if strict libphonenumber fails
      const digits = cleaned.replace(/[^0-9+]/g, '');
      if (digits.startsWith('+') && digits.length >= 8) return digits;
      if (digits.length === 10) return `+91${digits}`;
      if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.substring(1)}`;

      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Match device contacts against ChatFlow registered discoverable users
   */
  async matchContacts(deviceContacts: DeviceContact[], currentUserId?: string): Promise<PhoneContactsResult> {
    const onChatFlow: MatchedPhoneContact[] = [];
    const inviteToChatFlow: MatchedPhoneContact[] = [];

    if (!deviceContacts || deviceContacts.length === 0) {
      return { onChatFlow, inviteToChatFlow };
    }

    // Build payload of normalized numbers
    const payloadItems: { id: string; name: string; phone: string }[] = [];
    const contactMap = new Map<string, { contact: DeviceContact; rawPhone: string }>();

    for (const c of deviceContacts) {
      for (const rawPhone of c.phoneNumbers) {
        const norm = this.normalizePhoneNumber(rawPhone);
        if (norm) {
          payloadItems.push({ id: c.id, name: c.name, phone: norm });
          contactMap.set(norm, { contact: c, rawPhone });
        }
      }
    }

    if (payloadItems.length === 0) {
      return { onChatFlow, inviteToChatFlow };
    }

    try {
      // Direct Supabase query to match profiles with phone_number_normalized
      const normalizedNumbers = Array.from(contactMap.keys());
      const { data: matchedProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_discoverable', true)
        .in('phone_number_normalized', normalizedNumbers);

      const matchedPhones = new Set<string>();

      if (!error && matchedProfiles && matchedProfiles.length > 0) {
        for (const p of matchedProfiles as Profile[]) {
          if (p.id === currentUserId) continue; // skip self
          const normPhone = p.phone_number_normalized;
          if (normPhone && contactMap.has(normPhone)) {
            matchedPhones.add(normPhone);
            const item = contactMap.get(normPhone)!;
            
            // Check if already added to onChatFlow list
            if (!onChatFlow.some(m => m.profile?.id === p.id)) {
              onChatFlow.push({
                deviceContact: item.contact,
                profile: p,
                isOnChatFlow: true,
                primaryPhone: normPhone,
              });
            }
          }
        }
      }

      // Populate inviteToChatFlow for unmatched device contacts
      const processedContactIds = new Set<string>();
      for (const [normPhone, item] of contactMap.entries()) {
        if (!matchedPhones.has(normPhone) && !processedContactIds.has(item.contact.id)) {
          processedContactIds.add(item.contact.id);
          inviteToChatFlow.push({
            deviceContact: item.contact,
            isOnChatFlow: false,
            primaryPhone: normPhone,
          });
        }
      }

    } catch (err) {
      console.error('Error during contact matching:', err);
    }

    return { onChatFlow, inviteToChatFlow };
  }

  /**
   * Native Share / SMS invite helper
   */
  async shareInvite(contactName: string, phone: string) {
    const inviteText = `Hey ${contactName}, join me on ChatFlow for fast & private encrypted chats and calls! Download app: https://chatflow-messager.vercel.app`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join ChatFlow',
          text: inviteText,
          url: 'https://chatflow-messager.vercel.app',
        });
        return;
      } catch (e) {
        // Fallback to SMS
      }
    }

    // SMS protocol fallback
    window.location.href = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(inviteText)}`;
  }
}

export const deviceContactService = new DeviceContactService();
