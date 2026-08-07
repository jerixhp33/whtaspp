import { Message } from '@/types';
import { offlineDBService, OutgoingMessage } from './offline-db.service';

export const messageCacheService = {
  async cacheMessages(messages: Message[]): Promise<void> {
    if (!messages || messages.length === 0) return;
    await offlineDBService.saveMessages(messages);
  },

  async cacheMessage(message: Message): Promise<void> {
    if (!message) return;
    await offlineDBService.saveMessage(message);
  },

  async getCachedMessages(conversationId: string, limit: number = 100): Promise<Message[]> {
    return await offlineDBService.getMessagesByConversation(conversationId, limit);
  },

  async deleteCachedMessage(messageId: string): Promise<void> {
    await offlineDBService.deleteMessage(messageId);
  },

  async queueOutgoing(conversationId: string, payload: any, tempId: string): Promise<void> {
    const item: OutgoingMessage = {
      tempId,
      conversationId,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
    };
    await offlineDBService.enqueueOutgoing(item);
  },

  async getOutgoingQueue(): Promise<OutgoingMessage[]> {
    return await offlineDBService.getOutgoingQueue();
  },

  async removeOutgoing(tempId: string): Promise<void> {
    await offlineDBService.removeOutgoing(tempId);
  },
};
