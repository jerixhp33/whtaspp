import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, Profile, MessageAttachment } from '../types';
import { supabase } from '../lib/supabase';
import { messageCacheService } from '../services/offline/message-cache.service';
import { messageService } from '../services/message.service';
import { realUploadService, UploadCompleteResult } from '../services/realUploadService';
import { useAuth } from './useAuth';

const MESSAGE_SELECT_QUERY = `
  *,
  sender:profiles!sender_id(*),
  attachments:message_attachments(*),
  reactions:message_reactions(*),
  reads:message_reads(*),
  reply_to:messages!reply_to_id(*, sender:profiles!sender_id(*))
`;

const normalizeMessage = (msg: any): Message => {
  if (!msg) return msg;
  const replyTo = Array.isArray(msg.reply_to) ? (msg.reply_to[0] ?? undefined) : msg.reply_to;
  return { ...msg, reply_to: replyTo ?? undefined };
};

export const useMessages = (conversationId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isUnavailableOffline, setIsUnavailableOffline] = useState(false);

  const channelRef = useRef<any>(null);

  // Helper to fetch full single message with relations and reconcile
  const fetchFullMessage = useCallback(async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(MESSAGE_SELECT_QUERY)
        .eq('id', messageId)
        .single();

      if (!error && data) {
        const fullMsg = normalizeMessage(data as unknown as Message);
        setMessages((prev) => {
          const clientMsgId = fullMsg.metadata?.client_message_id;
          const index = prev.findIndex(
            (m) =>
              m.id === fullMsg.id ||
              (clientMsgId && (m as any).client_message_id === clientMsgId) ||
              (clientMsgId && m.metadata?.client_message_id === clientMsgId) ||
              (m as any).temp_id === clientMsgId
          );

          let nextMessages: Message[];
          if (index >= 0) {
            nextMessages = [...prev];
            nextMessages[index] = fullMsg;
          } else {
            nextMessages = [...prev, fullMsg];
          }
          // Cache updated messages
          messageCacheService.cacheMessage(fullMsg);
          return nextMessages;
        });
      }
    } catch (err) {
      console.warn('Failed to fetch full message:', err);
    }
  }, []);

  // Flush outgoing offline queue when online
  const flushOutgoingQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const queue = await messageCacheService.getOutgoingQueue();
      for (const item of queue) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .insert(item.payload)
            .select(MESSAGE_SELECT_QUERY)
            .single();

          if (!error && data) {
            await messageCacheService.removeOutgoing(item.tempId);
            // Replace temporary message in state
            setMessages((prev) =>
              prev.map((m) =>
                (m as any).temp_id === item.tempId || (m as any).client_message_id === item.tempId
                  ? (data as unknown as Message)
                  : m
              )
            );
            await messageCacheService.cacheMessage(data as unknown as Message);
          }
        } catch (err) {
          console.warn('Failed to send queued offline message:', err);
        }
      }
    } catch (err) {
      console.warn('Flush outgoing queue error:', err);
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOutgoingQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushOutgoingQueue]);

  // Load and subscribe to messages
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsUnavailableOffline(false);
      return;
    }

    let isMounted = true;

    const loadMessages = async () => {
      setLoading(true);
      setIsUnavailableOffline(false);

      // 1. Load from IndexedDB cache immediately for instant display
      try {
        const cached = await messageCacheService.getCachedMessages(conversationId);
        if (isMounted && cached && cached.length > 0) {
          setMessages(cached);
          setLoading(false);
        } else if (!navigator.onLine) {
          setIsUnavailableOffline(true);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Error reading cached messages:', err);
      }

      // 2. If online, fetch fresh messages from Supabase
      if (navigator.onLine) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select(MESSAGE_SELECT_QUERY)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

          if (isMounted) {
            if (!error && data) {
              const freshMessages = (data as unknown as Message[]).map(normalizeMessage);
              setMessages(freshMessages);
              
              if (user) {
                messageService.markConversationAsRead(conversationId, user.id).catch(console.error);
              }

              // Save to IndexedDB
              await messageCacheService.cacheMessages(freshMessages);
            }
            setLoading(false);
          }
        } catch (err) {
          console.error('Error fetching messages from server:', err);
          if (isMounted) setLoading(false);
        }
      }
    };

    loadMessages();

    // 3. Setup Supabase Realtime Subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

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
              await messageCacheService.deleteCachedMessage(oldId);
            }
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newMsg = payload.new as any;
            await fetchFullMessage(newMsg.id);
            
            if (user && newMsg.sender_id !== user.id) {
              messageService.markConversationAsRead(conversationId, user.id).catch(console.error);
            }
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
          const read = payload.new as any;
          if (read?.message_id) {
            await fetchFullMessage(read.message_id);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, fetchFullMessage]);

  // Send text or simple pre-uploaded message
  const sendMessage = async (
    content: string,
    messageType: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'document' = 'text',
    fileAttachment?: { file_name: string; file_url: string; file_size?: number; file_type?: string },
    replyToMessage?: Message | null,
    currentUser?: any,
    currentProfile?: Profile | null
  ) => {
    if (!conversationId || !currentUser) return;

    console.log('[ChatFlow Debug] sendMessage - replyToMessage:', replyToMessage?.id, replyToMessage?.content);

    const clientMsgId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const optimisticMsg: any = {
      id: clientMsgId,
      temp_id: clientMsgId,
      client_message_id: clientMsgId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content,
      message_type: messageType,
      created_at: new Date().toISOString(),
      sender: currentProfile || {
        id: currentUser.id,
        display_name: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0],
        username: currentUser.email?.split('@')[0],
      },
      is_pending: !navigator.onLine,
      metadata: {
        client_message_id: clientMsgId,
        audio_url: messageType === 'voice' || messageType === 'audio' ? fileAttachment?.file_url : undefined,
      },
      reply_to: replyToMessage || undefined,
      reply_to_id: replyToMessage?.id || undefined,
      attachments: fileAttachment ? [fileAttachment] : [],
      reactions: [],
      reads: [],
    };

    // 1. Instantly render optimistic message in UI
    setMessages((prev) => [...prev, optimisticMsg as Message]);

    // 2. If offline, store in local outgoing queue
    if (!navigator.onLine) {
      await messageCacheService.queueOutgoing(conversationId, optimisticMsg, clientMsgId);
      await messageCacheService.cacheMessage(optimisticMsg as Message);
      return;
    }

    // 3. Send to Supabase in background
    try {
      const payload: any = {
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content,
        message_type: messageType,
        metadata: { client_message_id: clientMsgId, ...(optimisticMsg.metadata || {}) },
      };

      if (replyToMessage?.id) {
        payload.reply_to_id = replyToMessage.id;
      }

      const { data: serverMsg, error } = await supabase
        .from('messages')
        .insert(payload)
        .select(MESSAGE_SELECT_QUERY)
        .single();

      if (error || !serverMsg) {
        throw error;
      }

      // If file attachment exists, insert row
      if (fileAttachment) {
        await supabase.from('message_attachments').insert({
          message_id: serverMsg.id,
          file_name: fileAttachment.file_name,
          file_type: fileAttachment.file_type || 'application/octet-stream',
          file_size: fileAttachment.file_size,
          file_url: fileAttachment.file_url,
        });
      }

      // Reconcile optimistic message with real message
      const confirmedMsg = normalizeMessage(serverMsg as unknown as Message);
      setMessages((prev) =>
        prev.map((m) =>
          (m as any).temp_id === clientMsgId || (m as any).client_message_id === clientMsgId
            ? confirmedMsg
            : m
        )
      );
      await messageCacheService.cacheMessage(confirmedMsg);

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) =>
          (m as any).client_message_id === clientMsgId ? { ...m, is_failed: true } : m
        )
      );
    }
  };

  /**
   * Send media with real 0-100% byte upload progress, local previews, and controlled queue
   */
  const sendMediaMessage = async (
    file: File | Blob,
    messageType: 'image' | 'video' | 'audio' | 'voice' | 'document',
    caption: string = '',
    replyToMessage?: Message | null,
    currentUser?: any,
    currentProfile?: Profile | null,
    customFileName?: string,
    durationSecs?: number
  ) => {
    if (!conversationId || !currentUser) return;

    const fileName = customFileName || (file instanceof File ? file.name : `file_${Date.now()}`);
    const clientMsgId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const localPreviewUrl = URL.createObjectURL(file);
    const bucket = realUploadService.resolveBucket(file.type || 'application/octet-stream');

    const tempAttachment: MessageAttachment = {
      id: `att_${clientMsgId}`,
      message_id: clientMsgId,
      file_name: fileName,
      file_type: file.type || 'application/octet-stream',
      file_size: file.size,
      file_url: localPreviewUrl,
      created_at: new Date().toISOString(),
      duration: durationSecs,
    };

    const optimisticMsg: Message = {
      id: clientMsgId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: caption,
      message_type: messageType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_edited: false,
      is_deleted: false,
      is_pending: true,
      uploadProgress: 0,
      uploadStatus: 'queued',
      localPreviewUrl,
      localFile: file,
      sender: (currentProfile as Profile) || {
        id: currentUser.id,
        display_name: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'User',
        username: currentUser.email?.split('@')[0] || 'user',
        email: currentUser.email || '',
        bio: '',
        status: 'online',
        is_online: true,
        last_seen: new Date().toISOString(),
        is_admin: false,
        is_disabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      metadata: {
        client_message_id: clientMsgId,
        bucket,
      },
      reply_to: replyToMessage || undefined,
      reply_to_id: replyToMessage?.id || undefined,
      attachments: [tempAttachment],
      reactions: [],
      reads: [],
    };

    // 1. Immediately display optimistic message in chat
    setMessages((prev) => [...prev, optimisticMsg]);

    // 2. Queue in real upload service with byte-accurate progress
    realUploadService.upload({
      id: clientMsgId,
      file,
      fileName,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
      bucket,
      duration: durationSecs,
      onProgress: (pct) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === clientMsgId
              ? {
                  ...m,
                  uploadProgress: pct,
                  uploadStatus: pct >= 100 ? 'completed' : 'uploading',
                }
              : m
          )
        );
      },
      onComplete: async (result: UploadCompleteResult) => {
        try {
          // Construct server message payload
          const payload: any = {
            conversation_id: conversationId,
            sender_id: currentUser.id,
            content: caption,
            message_type: messageType,
            metadata: {
              client_message_id: clientMsgId,
              storage_path: result.storage_path,
              bucket: result.bucket,
              duration: result.duration || durationSecs,
            },
          };

          if (replyToMessage?.id) {
            payload.reply_to_id = replyToMessage.id;
          }

          const { data: serverMsg, error } = await supabase
            .from('messages')
            .insert(payload)
            .select(MESSAGE_SELECT_QUERY)
            .single();

          if (error || !serverMsg) throw error;

          // Insert permanent attachment record
          const { data: attData } = await supabase
            .from('message_attachments')
            .insert({
              message_id: serverMsg.id,
              file_name: result.file_name,
              file_type: result.file_type,
              file_size: result.file_size,
              file_url: result.storage_path, // Store safe storage path, not raw URL
              thumbnail_url: result.thumbnail_path,
              duration: result.duration || durationSecs,
            })
            .select('*')
            .single();

          const finalMsg: Message = {
            ...normalizeMessage(serverMsg as unknown as Message),
            attachments: attData ? [attData] : serverMsg.attachments,
            localPreviewUrl,
            uploadProgress: 100,
            uploadStatus: 'completed' as const,
          };

          setMessages((prev) =>
            prev.map((m) => (m.id === clientMsgId ? finalMsg : m))
          );
          await messageCacheService.cacheMessage(finalMsg);

          await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);
        } catch (err: any) {
          console.error('Failed to commit media message:', err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === clientMsgId ? { ...m, is_failed: true, uploadStatus: 'failed' as const } : m
            )
          );
        }
      },
      onError: (err) => {
        console.error('Upload failed:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === clientMsgId ? { ...m, is_failed: true, uploadStatus: 'failed' } : m
          )
        );
      },
    });
  };

  /**
   * Cancel an ongoing media upload
   */
  const cancelMediaUpload = (clientMsgId: string) => {
    realUploadService.cancelUpload(clientMsgId);
    setMessages((prev) => {
      const target = prev.find((m) => m.id === clientMsgId);
      if (target?.localPreviewUrl) {
        URL.revokeObjectURL(target.localPreviewUrl);
      }
      return prev.filter((m) => m.id !== clientMsgId);
    });
  };

  /**
   * Retry a failed upload
   */
  const retryMediaUpload = (msg: Message, currentUser: any, currentProfile: any) => {
    if (!msg.localFile) return;
    // Remove failed item and re-send
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    sendMediaMessage(
      msg.localFile,
      msg.message_type as any,
      msg.content || '',
      msg.reply_to,
      currentUser,
      currentProfile,
      msg.attachments?.[0]?.file_name
    );
  };

  // Edit message
  const editMessage = async (messageId: string, newContent: string) => {
    try {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content: newContent, is_edited: true } : m))
      );
      await supabase
        .from('messages')
        .update({ content: newContent, is_edited: true })
        .eq('id', messageId);
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  // Delete message (soft delete)
  const deleteMessage = async (messageId: string) => {
    try {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_deleted: true, content: 'This message was deleted' }
            : m
        )
      );
      await supabase
        .from('messages')
        .update({ is_deleted: true, content: 'This message was deleted' })
        .eq('id', messageId);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Toggle reaction
  const toggleReaction = async (messageId: string, emoji: string, userId: string) => {
    // 1. Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          const reactions = m.reactions || [];
          const hasSameEmoji = reactions.some((r) => r.user_id === userId && r.emoji === emoji);
          const filteredReactions = reactions.filter((r) => r.user_id !== userId);
          return {
            ...m,
            reactions: hasSameEmoji
              ? filteredReactions
              : [
                  ...filteredReactions,
                  {
                    id: `temp_${Date.now()}`,
                    message_id: messageId,
                    user_id: userId,
                    emoji,
                    created_at: new Date().toISOString(),
                  },
                ],
          };
        }
        return m;
      })
    );

    try {
      // 2. Fetch user's existing reaction(s) for this message from DB
      const { data: existingReactions } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId)
        .eq('user_id', userId);

      if (existingReactions && existingReactions.length > 0) {
        const hasSameEmoji = existingReactions.some((r) => r.emoji === emoji);
        
        // Always clear existing reactions first (to enforce 1 reaction per user)
        await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', userId);

        // If they didn't click the same emoji, insert the new one
        if (!hasSameEmoji) {
          await supabase.from('message_reactions').insert({
            message_id: messageId,
            user_id: userId,
            emoji,
          });
        }
      } else {
        // No existing reaction, just insert
        await supabase.from('message_reactions').insert({
          message_id: messageId,
          user_id: userId,
          emoji,
        });
      }

      await fetchFullMessage(messageId);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
      // If it fails, revert the optimistic update by fetching the real state
      await fetchFullMessage(messageId);
    }
  };

  return {
    messages,
    setMessages,
    loading,
    isOnline,
    isUnavailableOffline,
    sendMessage,
    sendMediaMessage,
    cancelMediaUpload,
    retryMediaUpload,
    editMessage,
    deleteMessage,
    toggleReaction,
    refetchMessage: fetchFullMessage,
    flushOutgoingQueue,
  };
};
