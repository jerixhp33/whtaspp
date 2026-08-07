import { useState } from 'react';
import { Conversation } from '../types';

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  return { conversations, activeConversation, setActiveConversation, setConversations };
};
