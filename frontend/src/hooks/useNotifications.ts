import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';
import { notificationService } from '../services/notification.service';
import { notificationCacheService } from '../services/offline/notification-cache.service';

const PAGE_SIZE = 30;

export function useNotifications(
  userId: string | undefined,
  activeConversationId: string | undefined,
  onNewNotification?: (notification: Notification) => void
) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const activeConvRef = useRef(activeConversationId);

  // Keep activeConversationId ref up to date for realtime callback
  useEffect(() => {
    activeConvRef.current = activeConversationId;
  }, [activeConversationId]);

  // Initial fetch
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchInitial = async () => {
      setLoading(true);
      try {
        const { data, count } = await notificationService.getNotifications(userId, PAGE_SIZE, 0);
        const items = (data || []) as Notification[];
        setNotifications(items);
        setHasMore(items.length >= PAGE_SIZE);

        const uc = items.filter((n) => !n.is_read).length;
        setUnreadCount(uc);

        // Cache for offline viewing
        notificationCacheService.cacheNotifications(items);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        // Try offline cache
        const cached = await notificationCacheService.getCachedNotifications(userId, PAGE_SIZE);
        if (cached.length > 0) {
          setNotifications(cached);
          const uc = await notificationCacheService.getCachedUnreadCount(userId);
          setUnreadCount(uc);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, [userId]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!userId) return;

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;

          // Check if user is currently viewing the conversation this notification is about
          if (
            newNotif.conversation_id &&
            activeConvRef.current === newNotif.conversation_id &&
            (newNotif.type === 'message' || newNotif.type === 'reply')
          ) {
            // Auto-mark as read since user is viewing that chat
            notificationService.markAsRead(newNotif.id);
            return;
          }

          // Add to state
          setNotifications((prev) => {
            // Deduplicate
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
          setUnreadCount((prev) => prev + 1);

          // Cache
          notificationCacheService.cacheNotifications([newNotif]);

          // Notify parent (for toast/sound)
          if (onNewNotification) {
            onNewNotification(newNotif);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          // Recalculate unread
          setNotifications((prev) => {
            setUnreadCount(prev.filter((n) => !n.is_read).length);
            return prev;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, onNewNotification]);

  const markAsRead = useCallback(
    async (id: string) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      notificationCacheService.markCachedAsRead(id);
      await notificationService.markAsRead(id);
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
    await notificationService.markAllAsRead(userId);
  }, [userId]);

  const clearNotifications = useCallback(async () => {
    if (!userId) return;
    setNotifications([]);
    setUnreadCount(0);
    await notificationService.clearNotifications(userId);
    await notificationCacheService.clearCache(userId);
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (!userId || loading || !hasMore) return;
    setLoading(true);
    try {
      const offset = notifications.length;
      const { data } = await notificationService.getNotifications(userId, PAGE_SIZE, offset);
      const items = (data || []) as Notification[];
      if (items.length < PAGE_SIZE) setHasMore(false);
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const unique = items.filter((n) => !existingIds.has(n.id));
        return [...prev, ...unique];
      });
      notificationCacheService.cacheNotifications(items);
    } catch (err) {
      console.error('Failed to load more notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, loading, hasMore, notifications.length]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    loadMore,
    loading,
    hasMore,
  };
}
