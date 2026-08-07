import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types';
import { supabase } from '../lib/supabase';

const MESSAGE_SELECT_QUERY = `
  *,
  sender:profiles!sender_id(*),
  attachments:message_attachments(*),
  reactions:message_reactions(*),
  reads:message_reads(*),
  reply_to:messages!reply_to_id(*, sender:profiles!sender_id(*))
`;

export const useMessages = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFullMessage = useCallback(async (messageId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(MESSAGE_SELECT_QUERY)
      .eq('id', messageId)
      .single();

    if (!error && data) {
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === data.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data as any;
          return updated;
        }
        return [...prev, data as any];
      });
    }
  }, []);

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
          .select(MESSAGE_SELECT_QUERY)
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

    // Subscribe to Supabase Realtime for messages, attachments, reactions, and reads
    const channel = supabase
      .channel(`conversation-live-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              setMessages((prev) => prev.filter((m) => m.id !== oldId));
            }
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newMsg = payload.new as any;
            await fetchFullMessage(newMsg.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_attachments',
        },
        async (payload) => {
          const newAttachment = (payload.new as any) || (payload.old as any);
          if (newAttachment?.message_id) {
            await fetchFullMessage(newAttachment.message_id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        async (payload) => {
          const reaction = (payload.new as any) || (payload.old as any);
          if (reaction?.message_id) {
            await fetchFullMessage(reaction.message_id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reads',
        },
        async (payload) => {
          const read = (payload.new as any);
          if (read?.message_id) {
            await fetchFullMessage(read.message_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchFullMessage]);

  return { messages, setMessages, loading, refetchMessage: fetchFullMessage };
};
