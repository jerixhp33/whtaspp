import { useState, useEffect } from 'react';
import { Message } from '../types';
import { supabase } from '../lib/supabase';

export const useMessages = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles!sender_id(*), attachments:message_attachments(*), reply_to:messages!reply_to_id(*, sender:profiles!sender_id(*))')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setMessages(data as any);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to Supabase Realtime for new or updated messages in this conversation
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newMsg = payload.new as any;
            
            // Fetch complete message with sender profile, attachments, and reply_to
            const { data: fullMsgData } = await supabase
              .from('messages')
              .select('*, sender:profiles!sender_id(*), attachments:message_attachments(*), reply_to:messages!reply_to_id(*, sender:profiles!sender_id(*))')
              .eq('id', newMsg.id)
              .single();

            if (fullMsgData) {
              setMessages((prev) => {
                const index = prev.findIndex((m) => m.id === fullMsgData.id);
                if (index >= 0) {
                  const updated = [...prev];
                  updated[index] = fullMsgData as any;
                  return updated;
                }
                return [...prev, fullMsgData as any];
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return { messages, setMessages, loading };
};
