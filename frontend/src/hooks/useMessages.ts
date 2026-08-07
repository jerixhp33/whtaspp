import { useState } from 'react';
import { Message } from '../types';

export const useMessages = (_conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  return { messages, setMessages };
};
