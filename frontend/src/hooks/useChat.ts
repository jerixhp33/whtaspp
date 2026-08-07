import React, { useState, useEffect, createContext, useContext } from 'react';
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
}

const ChatContext = createContext<ChatContextType>({
  conversations: [],
  activeConversation: null,
  setActiveConversation: () => {},
  setConversations: () => {},
  loading: false,
  refreshConversations: async () => {},
});

export const useChat = () => useContext(ChatContext);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

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
        .select('*, conversation_members(*, profile:profiles(*)), groups(*)')
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

  const value = {
    conversations,
    activeConversation,
    setActiveConversation,
    setConversations,
    loading,
    refreshConversations: fetchConversations,
  };

  return React.createElement(ChatContext.Provider, { value }, children);
}
