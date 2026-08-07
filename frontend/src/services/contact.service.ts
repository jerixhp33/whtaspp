import { supabase } from '../lib/supabase';

export const contactService = {
  getContacts: async () => supabase.from('contacts').select('*'),
  searchUsers: async (query: string) => supabase.from('profiles').select('*').ilike('username', `%${query}%`),
  sendContactRequest: async (toUserId: string) => supabase.from('contact_requests').insert({ to_user_id: toUserId, status: 'pending' }),
  getContactRequests: async () => supabase.from('contact_requests').select('*').eq('status', 'pending'),
  acceptContactRequest: async (id: string) => supabase.from('contact_requests').update({ status: 'accepted' }).eq('id', id),
  rejectContactRequest: async (id: string) => supabase.from('contact_requests').update({ status: 'rejected' }).eq('id', id),
  removeContact: async (contactId: string) => supabase.from('contacts').delete().eq('contact_id', contactId),
  blockUser: async (userId: string) => supabase.from('blocked_users').insert({ blocked_user_id: userId }),
  unblockUser: async (userId: string) => supabase.from('blocked_users').delete().eq('blocked_user_id', userId),
  getBlockedUsers: async () => supabase.from('blocked_users').select('*')
};
