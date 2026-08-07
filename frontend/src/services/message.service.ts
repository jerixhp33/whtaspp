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
  markConversationAsRead: async (conversationId: string, userId: string) => {
    // 1. Get unread messages
    const { data: unread } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
    
    if (unread && unread.length > 0) {
      const reads = unread.map(m => ({ message_id: m.id, user_id: userId }));
      return supabase.from('message_reads').upsert(reads, { onConflict: 'message_id,user_id', ignoreDuplicates: true });
    }
    return { data: null, error: null };
  },
  searchMessages: async (query: string) => supabase.from('messages').select('*').textSearch('content', query)
};
