import { Contacts } from '@capacitor-community/contacts';
import parsePhoneNumberFromString from 'libphonenumber-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { contactsCapability } from '@/capabilities/contacts';

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
    const status = await contactsCapability.getStatus();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'prompt';
  }

  /**
   * Request contacts permission from OS
   */
  async requestPermission(): Promise<boolean> {
    const status = await contactsCapability.request();
    return status === 'granted';
  }

  /**
   * Read contacts from device address book or custom contacts
   */
  async getDeviceContacts(): Promise<DeviceContact[]> {
    try {
      const items = await contactsCapability.readContacts();
      if (items && items.length > 0) {
        return items.map((c, idx) => ({
          id: c.id || `contact-${idx}`,
          name: c.name || 'Unknown Contact',
          phoneNumbers: c.phones || [],
        })).filter(c => c.phoneNumbers.length > 0);
      }
      return [];
    } catch (err) {
      console.error('Failed to get device contacts:', err);
      return [];
    }
  }

  /**
   * Add a new phone contact manually (for testing or web users)
   */
  addCustomContact(name: string, phone: string): void {
    contactsCapability.addCustomContact(name, phone);
  }

  /**
   * Normalize phone number to E.164 (+919876543210) using libphonenumber-js
   */
  normalizePhoneNumber(phoneStr: string, defaultCountry: any = 'IN'): string | null {
    if (!phoneStr) return null;
    try {
      const cleaned = phoneStr.trim();
      const parsed = parsePhoneNumberFromString(cleaned, defaultCountry);
      if (parsed && parsed.isValid()) {
        return parsed.format('E.164');
      }

      // Fallback regex normalization
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
      // Also fetch any existing discoverable users as recommendations if contact list is empty
      try {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', currentUserId || '')
          .limit(10);

        if (allProfiles && allProfiles.length > 0) {
          for (const p of allProfiles as Profile[]) {
            if (p.phone_number_normalized) {
              onChatFlow.push({
                deviceContact: {
                  id: `profile-${p.id}`,
                  name: p.display_name || p.username || 'ChatFlow User',
                  phoneNumbers: [p.phone_number_normalized],
                },
                profile: p,
                isOnChatFlow: true,
                primaryPhone: p.phone_number_normalized,
              });
            }
          }
        }
      } catch (_) {}

      return { onChatFlow, inviteToChatFlow };
    }

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
      const normalizedNumbers = Array.from(contactMap.keys());
      const { data: matchedProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('phone_number_normalized', normalizedNumbers);

      const matchedPhones = new Set<string>();

      if (!error && matchedProfiles && matchedProfiles.length > 0) {
        for (const p of matchedProfiles as Profile[]) {
          if (p.id === currentUserId) continue;
          const normPhone = p.phone_number_normalized;
          if (normPhone && contactMap.has(normPhone)) {
            matchedPhones.add(normPhone);
            const item = contactMap.get(normPhone)!;
            
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

      for (const [normPhone, item] of contactMap.entries()) {
        if (!matchedPhones.has(normPhone)) {
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
      } catch (e) {}
    }

    window.location.href = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(inviteText)}`;
  }
}

export const deviceContactService = new DeviceContactService();
