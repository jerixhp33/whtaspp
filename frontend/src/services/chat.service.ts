import { supabase } from '../lib/supabase';
import { Conversation, Group } from '../types';

export const chatService = {
  getConversations: async () => supabase.from('conversations').select('*'),
  getConversation: async (id: string) => supabase.from('conversations').select('*').eq('id', id).single(),
  getOrCreatePrivateConversation: async (userId: string) => supabase.rpc('get_or_create_private_conversation', { other_user_id: userId }),
  createGroup: async (group: Partial<Group>) => supabase.from('groups').insert(group),
  updateGroup: async (id: string, group: Partial<Group>) => supabase.from('groups').update(group).eq('id', id),
  addGroupMember: async (conversationId: string, userId: string, role: string) => supabase.from('conversation_members').insert({ conversation_id: conversationId, user_id: userId, role }),
  removeGroupMember: async (conversationId: string, userId: string) => supabase.from('conversation_members').delete().match({ conversation_id: conversationId, user_id: userId }),
  leaveGroup: async (conversationId: string) => supabase.from('conversation_members').delete().match({ conversation_id: conversationId }) // current user leaves
};
