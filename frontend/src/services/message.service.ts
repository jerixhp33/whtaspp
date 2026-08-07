import { supabase } from '../lib/supabase';
import { Message, MessageType } from '../types';

export const messageService = {
  getMessages: async (conversationId: string, page: number = 0, limit: number = 50) => 
    supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false }).range(page * limit, (page + 1) * limit - 1),
  sendMessage: async (message: Partial<Message>) => supabase.from('messages').insert(message),
  editMessage: async (id: string, content: string) => supabase.from('messages').update({ content, is_edited: true }).eq('id', id),
  deleteMessage: async (id: string) => supabase.from('messages').update({ is_deleted: true, content: '' }).eq('id', id),
  forwardMessage: async (messageId: string, toConversationId: string) => supabase.rpc('forward_message', { msg_id: messageId, to_conv: toConversationId }),
  addReaction: async (messageId: string, emoji: string) => supabase.from('message_reactions').insert({ message_id: messageId, emoji }),
  removeReaction: async (messageId: string, emoji: string) => supabase.from('message_reactions').delete().match({ message_id: messageId, emoji }),
  markAsRead: async (messageId: string) => supabase.from('message_reads').insert({ message_id: messageId }),
  searchMessages: async (query: string) => supabase.from('messages').select('*').textSearch('content', query)
};
