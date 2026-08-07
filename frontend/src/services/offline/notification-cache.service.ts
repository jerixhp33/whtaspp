import { openDB, IDBPDatabase } from 'idb';
import type { Notification } from '../../types';

const DB_NAME = 'chatflow-notification-cache';
const DB_VERSION = 1;
const STORE_NAME = 'notifications';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('user_id', 'user_id', { unique: false });
          store.createIndex('user_created', ['user_id', 'created_at'], { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

export const notificationCacheService = {
  cacheNotifications: async (notifications: Notification[]): Promise<void> => {
    try {
      const db = await getDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      for (const n of notifications) {
        await tx.store.put(n);
      }
      await tx.done;
    } catch (err) {
      console.warn('Failed to cache notifications:', err);
    }
  },

  getCachedNotifications: async (userId: string, limit = 30): Promise<Notification[]> => {
    try {
      const db = await getDb();
      const all = await db.getAllFromIndex(STORE_NAME, 'user_id', userId);
      // Sort by created_at DESC
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return all.slice(0, limit);
    } catch {
      return [];
    }
  },

  getCachedUnreadCount: async (userId: string): Promise<number> => {
    try {
      const db = await getDb();
      const all = await db.getAllFromIndex(STORE_NAME, 'user_id', userId);
      return all.filter((n: any) => !n.is_read).length;
    } catch {
      return 0;
    }
  },

  markCachedAsRead: async (id: string): Promise<void> => {
    try {
      const db = await getDb();
      const notif = await db.get(STORE_NAME, id);
      if (notif) {
        notif.is_read = true;
        notif.read_at = new Date().toISOString();
        await db.put(STORE_NAME, notif);
      }
    } catch {
      // ignore
    }
  },

  clearCache: async (userId: string): Promise<void> => {
    try {
      const db = await getDb();
      const all = await db.getAllFromIndex(STORE_NAME, 'user_id', userId);
      const tx = db.transaction(STORE_NAME, 'readwrite');
      for (const n of all) {
        await tx.store.delete(n.id);
      }
      await tx.done;
    } catch {
      // ignore
    }
  },
};
