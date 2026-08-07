import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Conversation } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (conv: Conversation | null) => void;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  loading: boolean;
  refreshConversations: () => Promise<void>;
  onlineUserIds: Set<string>;
  typingUsernames: Record<string, string>; // conversation_id -> username typing
  sendTypingSignal: (conversationId: string, isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  activeConversation: null,
  setActiveConversation: () => {},
  setConversations: () => {},
  loading: false,
  refreshConversations: async () => {},
  onlineUserIds: new Set(),
  typingUsernames: {},
  sendTypingSignal: () => {},
});

export const useChat = () => useContext(ChatContext);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUsernames, setTypingUsernames] = useState<Record<string, string>>({});
  const [typingChannel, setTypingChannel] = useState<any>(null);

  const fetchConversations = async () => {
    if (!user?.id) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      const { data: memberRows, error: memberErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (memberErr || !memberRows || memberRows.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const convIds = memberRows.map((m: any) => m.conversation_id);

      const { data: convData, error: convErr } = await supabase
        .from('conversations')
        .select('*, conversation_members(*, profiles(*)), groups(*)')
        .in('id', convIds)
        .order('updated_at', { ascending: false });

      if (!convErr && convData) {
        setConversations(convData as any);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user?.id]);

  // Presence Subscription (Online / Offline status)
  useEffect(() => {
    if (!user?.id) return;

    const presenceChan = supabase.channel('global-presence', {
      config: { presence: { key: user.id } }
    });

    presenceChan
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChan.presenceState();
        const onlineSet = new Set<string>(Object.keys(state));
        setOnlineUserIds(onlineSet);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChan.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Broadcast channel for typing indicators
    const bChannel = supabase.channel('chat-typing-global');
    bChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, conversation_id, is_typing, username } = payload.payload;
        if (user_id === user.id) return;

        setTypingUsernames((prev) => {
          const next = { ...prev };
          if (is_typing) {
            next[conversation_id] = username || 'Someone';
          } else {
            delete next[conversation_id];
          }
          return next;
        });
      })
      .subscribe();

    setTypingChannel(bChannel);

    return () => {
      supabase.removeChannel(presenceChan);
      supabase.removeChannel(bChannel);
    };
  }, [user?.id]);

  const sendTypingSignal = useCallback((conversationId: string, isTyping: boolean) => {
    if (!typingChannel || !user) return;
    typingChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user.id,
        conversation_id: conversationId,
        is_typing: isTyping,
        username: profile?.display_name || profile?.username || 'User'
      }
    });
  }, [typingChannel, user, profile]);

  const value = {
    conversations,
    activeConversation,
    setActiveConversation,
    setConversations,
    loading,
    refreshConversations: fetchConversations,
    onlineUserIds,
    typingUsernames,
    sendTypingSignal,
  };

  return React.createElement(ChatContext.Provider, { value }, children);
}
