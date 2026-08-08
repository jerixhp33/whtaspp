import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Message, Conversation, Profile } from '@/types';

export interface CachedMedia {
  id: string; // storage path or hash
  blob: Blob;
  mimeType: string;
  fileName: string;
  size: number;
  cachedAt: number;
}

export interface OutgoingMessage {
  tempId: string;
  conversationId: string;
  payload: any;
  createdAt: number;
  retryCount: number;
}

interface ChatFlowDBSchema extends DBSchema {
  conversations: {
    key: string;
    value: Conversation;
    indexes: { 'by-updated': string };
  };
  messages: {
    key: string;
    value: Message;
    indexes: { 'by-conversation': string; 'by-created': string };
  };
  profiles: {
    key: string;
    value: Profile;
  };
  media: {
    key: string;
    value: CachedMedia;
    indexes: { 'by-cached-at': number };
  };
  outgoing_queue: {
    key: string;
    value: OutgoingMessage;
    indexes: { 'by-conversation': string; 'by-created': number };
  };
}

const DB_NAME = 'chatflow_offline_db';
const DB_VERSION = 1;

class OfflineDBService {
  private dbPromise: Promise<IDBPDatabase<ChatFlowDBSchema>> | null = null;

  private getDB(): Promise<IDBPDatabase<ChatFlowDBSchema>> {
    if (!this.dbPromise) {
      this.dbPromise = this.openDatabase();
    }
    return this.dbPromise;
  }

  private openDatabase(): Promise<IDBPDatabase<ChatFlowDBSchema>> {
    return openDB<ChatFlowDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
          convStore.createIndex('by-updated', 'updated_at');
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('by-conversation', 'conversation_id');
          msgStore.createIndex('by-created', 'created_at');
        }

        // Profiles store
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }

        // Media blobs store
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
          mediaStore.createIndex('by-cached-at', 'cachedAt');
        }

        // Outgoing queue store
        if (!db.objectStoreNames.contains('outgoing_queue')) {
          const queueStore = db.createObjectStore('outgoing_queue', { keyPath: 'tempId' });
          queueStore.createIndex('by-conversation', 'conversationId');
          queueStore.createIndex('by-created', 'createdAt');
        }
      },
    });
  }

  /**
   * Wraps a DB operation with automatic reconnection if the connection was closed.
   * On InvalidStateError (connection closing), resets the cached promise and retries once.
   */
  private async withRetry<T>(operation: (db: IDBPDatabase<ChatFlowDBSchema>) => Promise<T>): Promise<T> {
    try {
      const db = await this.getDB();
      return await operation(db);
    } catch (err: any) {
      if (err?.name === 'InvalidStateError' || err?.message?.includes('connection is closing')) {
        // Connection was closed — reopen and retry once
        this.dbPromise = this.openDatabase();
        const db = await this.getDB();
        return await operation(db);
      }
      throw err;
    }
  }

  // --- Conversations ---
  async saveConversations(conversations: Conversation[]): Promise<void> {
    try {
      await this.withRetry(async (db) => {
        const tx = db.transaction('conversations', 'readwrite');
        for (const conv of conversations) {
          await tx.store.put(conv);
        }
        await tx.done;
      });
    } catch (err) {
      console.warn('OfflineDB: saveConversations failed', err);
    }
  }

  async getConversations(): Promise<Conversation[]> {
    try {
      return await this.withRetry((db) => db.getAll('conversations'));
    } catch (err) {
      console.warn('OfflineDB: getConversations failed', err);
      return [];
    }
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    try {
      await this.withRetry((db) => db.put('conversations', conversation));
    } catch (err) {
      console.warn('OfflineDB: saveConversation failed', err);
    }
  }

  // --- Messages ---
  async saveMessages(messages: Message[]): Promise<void> {
    try {
      await this.withRetry(async (db) => {
        const tx = db.transaction('messages', 'readwrite');
        for (const msg of messages) {
          await tx.store.put(msg);
        }
        await tx.done;
      });
    } catch (err) {
      console.warn('OfflineDB: saveMessages failed', err);
    }
  }

  async getMessagesByConversation(conversationId: string, limit: number = 100): Promise<Message[]> {
    try {
      return await this.withRetry(async (db) => {
        const index = db.transaction('messages').store.index('by-conversation');
        const messages = await index.getAll(conversationId);
        // Sort chronologically ascending
        return messages
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .slice(-limit);
      });
    } catch (err) {
      console.warn('OfflineDB: getMessagesByConversation failed', err);
      return [];
    }
  }

  async saveMessage(message: Message): Promise<void> {
    try {
      await this.withRetry((db) => db.put('messages', message));
    } catch (err) {
      console.warn('OfflineDB: saveMessage failed', err);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.withRetry((db) => db.delete('messages', messageId));
    } catch (err) {
      console.warn('OfflineDB: deleteMessage failed', err);
    }
  }

  // --- Profiles ---
  async saveProfile(profile: Profile): Promise<void> {
    try {
      await this.withRetry((db) => db.put('profiles', profile));
    } catch (err) {
      console.warn('OfflineDB: saveProfile failed', err);
    }
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    try {
      return await this.withRetry((db) => db.get('profiles', userId));
    } catch (err) {
      console.warn('OfflineDB: getProfile failed', err);
      return undefined;
    }
  }

  // --- Media Blobs ---
  async saveMediaBlob(id: string, blob: Blob, mimeType: string, fileName: string): Promise<void> {
    try {
      await this.withRetry(async (db) => {
        await db.put('media', {
          id,
          blob,
          mimeType,
          fileName,
          size: blob.size,
          cachedAt: Date.now(),
        });
      });
    } catch (err) {
      console.warn('OfflineDB: saveMediaBlob failed', err);
    }
  }

  async getMediaBlob(id: string): Promise<CachedMedia | undefined> {
    try {
      return await this.withRetry((db) => db.get('media', id));
    } catch (err) {
      console.warn('OfflineDB: getMediaBlob failed', err);
      return undefined;
    }
  }

  // --- Outgoing Pending Queue ---
  async enqueueOutgoing(item: OutgoingMessage): Promise<void> {
    try {
      await this.withRetry((db) => db.put('outgoing_queue', item));
    } catch (err) {
      console.warn('OfflineDB: enqueueOutgoing failed', err);
    }
  }

  async getOutgoingQueue(): Promise<OutgoingMessage[]> {
    try {
      return await this.withRetry((db) => db.getAll('outgoing_queue'));
    } catch (err) {
      console.warn('OfflineDB: getOutgoingQueue failed', err);
      return [];
    }
  }

  async removeOutgoing(tempId: string): Promise<void> {
    try {
      await this.withRetry((db) => db.delete('outgoing_queue', tempId));
    } catch (err) {
      console.warn('OfflineDB: removeOutgoing failed', err);
    }
  }

  // --- Storage Stats & Clearing ---
  async getStorageStats(): Promise<{ conversationsCount: number; messagesCount: number; mediaBytes: number; mediaCount: number }> {
    try {
      return await this.withRetry(async (db) => {
        const conversationsCount = await db.count('conversations');
        const messagesCount = await db.count('messages');
        const allMedia = await db.getAll('media');
        const mediaBytes = allMedia.reduce((sum, item) => sum + (item.size || 0), 0);
        return {
          conversationsCount,
          messagesCount,
          mediaBytes,
          mediaCount: allMedia.length,
        };
      });
    } catch (err) {
      console.warn('OfflineDB: getStorageStats failed', err);
      return { conversationsCount: 0, messagesCount: 0, mediaBytes: 0, mediaCount: 0 };
    }
  }

  async clearLocalCache(): Promise<void> {
    try {
      await this.withRetry(async (db) => {
        await db.clear('conversations');
        await db.clear('messages');
        await db.clear('profiles');
        await db.clear('media');
      });
    } catch (err) {
      console.warn('OfflineDB: clearLocalCache failed', err);
    }
  }
}

export const offlineDBService = new OfflineDBService();
