import { Conversation } from '@/types';
import { offlineDBService } from './offline-db.service';

export const conversationCacheService = {
  async cacheConversations(conversations: Conversation[]): Promise<void> {
    if (!conversations || conversations.length === 0) return;
    await offlineDBService.saveConversations(conversations);
  },

  async cacheConversation(conversation: Conversation): Promise<void> {
    if (!conversation) return;
    await offlineDBService.saveConversation(conversation);
  },

  async getCachedConversations(): Promise<Conversation[]> {
    return await offlineDBService.getConversations();
  },
};
