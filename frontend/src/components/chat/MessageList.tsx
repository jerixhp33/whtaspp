import { useEffect, useRef, useState, UIEvent, useMemo } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';
import { ArrowDown, WifiOff, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaViewerItem } from '@/components/media/MediaViewerModal';
import { MessageActionSheet } from './MessageActionSheet';
import { ForwardModal } from './ForwardModal';
import { MessageSelectionToolbar } from './MessageSelectionToolbar';

interface Props {
  onReply?: (msg: Message) => void;
  onEdit?: (msg: Message) => void;
  messagesHook: ReturnType<typeof useMessages>;
}

export function MessageList({ onReply, onEdit, messagesHook }: Props) {
  const { activeConversation } = useChat();
  const { user } = useAuth();
  const {
    messages,
    isOnline,
    isUnavailableOffline,
    deleteMessage,
    toggleReaction,
    sendMessage,
    cancelMediaUpload,
    retryMediaUpload,
  } = messagesHook;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesLengthRef = useRef(0);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Message Action Sheet state
  const [actionSheetMessage, setActionSheetMessage] = useState<Message | null>(null);

  // Forward Modal state
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);

  // Multi-select state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  const isGroup = activeConversation?.type === 'group';

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
    setShowScrollBottomBtn(false);
    setUnreadCount(0);
  };

  // Scroll to original replied message with visual flash
  const handleScrollToReply = (replyId: string) => {
    const el = document.getElementById(`message-${replyId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-emerald-500/25', 'transition-colors', 'duration-700');
      setTimeout(() => {
        el.classList.remove('bg-emerald-500/25');
      }, 1500);
    }
  };

  // Build the list of all media items in current conversation for gallery navigation
  const allMediaItems = useMemo<MediaViewerItem[]>(() => {
    const items: MediaViewerItem[] = [];
    for (const msg of messages) {
      if (msg.is_deleted) continue;
      const att = msg.attachments?.[0];
      const url = att?.file_url || msg.metadata?.audio_url || msg.metadata?.file_url;
      if (!url) continue;

      if (msg.message_type === 'image' || msg.message_type === 'video') {
        items.push({
          id: msg.id,
          url,
          type: msg.message_type === 'video' ? 'video' : 'image',
          fileName: att?.file_name || 'Media',
          senderName: msg.sender?.display_name || msg.sender?.username,
          createdAt: msg.created_at,
        });
      }
    }
    return items;
  }, [messages]);

  // Scroll listener to detect when user has scrolled up
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distanceFromBottom > 150) {
      setShowScrollBottomBtn(true);
    } else {
      setShowScrollBottomBtn(false);
      setUnreadCount(0);
    }
  };

  // Handle auto-scroll logic on messages change
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const isInitialLoad = prevMessagesLengthRef.current === 0;
    const newMsgCount = messages.length - prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (isInitialLoad) {
      scrollToBottom('auto');
      return;
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const lastMsg = messages[messages.length - 1];
    const isOwnLastMsg = lastMsg?.sender_id === user?.id;

    if (distanceFromBottom < 150 || isOwnLastMsg) {
      scrollToBottom('smooth');
    } else if (newMsgCount > 0) {
      setShowScrollBottomBtn(true);
      setUnreadCount((prev) => prev + newMsgCount);
    }
  }, [messages, user?.id]);

  // Reset scroll on active conversation change
  useEffect(() => {
    prevMessagesLengthRef.current = 0;
    setShowScrollBottomBtn(false);
    setUnreadCount(0);
    setIsSelectMode(false);
    setSelectedMessageIds(new Set());
    scrollToBottom('auto');
  }, [activeConversation?.id]);

  // Multi-select handlers
  const toggleSelectMessage = (msg: Message) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(msg.id)) next.delete(msg.id);
      else next.add(msg.id);
      return next;
    });
  };

  const selectedMessagesList = useMemo(() => {
    return messages.filter((m) => selectedMessageIds.has(m.id));
  }, [messages, selectedMessageIds]);

  const handleCopySelected = () => {
    const textToCopy = selectedMessagesList
      .map((m) => `[${m.sender?.display_name || 'User'}]: ${m.content}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert(`Copied ${selectedMessagesList.length} messages`);
      setIsSelectMode(false);
      setSelectedMessageIds(new Set());
    });
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selectedMessagesList.length} selected messages?`)) return;
    for (const msg of selectedMessagesList) {
      if (msg.sender_id === user?.id) {
        await deleteMessage(msg.id);
      }
    }
    setIsSelectMode(false);
    setSelectedMessageIds(new Set());
  };

  const handleShareSelected = async () => {
    const textToShare = selectedMessagesList
      .map((m) => `${m.content}`)
      .join('\n\n');
    if (navigator.share) {
      try {
        await navigator.share({ text: textToShare });
      } catch {
        // Ignored if cancelled
      }
    } else {
      navigator.clipboard.writeText(textToShare);
      alert('Copied to clipboard for sharing');
    }
    setIsSelectMode(false);
    setSelectedMessageIds(new Set());
  };

  const handleRetryMessage = (msg: Message) => {
    if (!user) return;
    if (msg.localFile) {
      retryMediaUpload(msg, user, (user as any).profile || null);
    } else if (msg.content) {
      sendMessage(msg.content, msg.message_type as any, msg.attachments?.[0], msg.reply_to, user);
    }
  };

  const handleShareSingle = async (msg: Message) => {
    const textContent = msg.content || '';
    if (navigator.share) {
      try {
        await navigator.share({ text: textContent });
      } catch {
        // Ignored
      }
    } else {
      navigator.clipboard.writeText(textContent);
      alert('Copied message to clipboard');
    }
  };

  if (!activeConversation) return null;

  return (
    <div className="relative flex-1 min-h-0 h-full w-full bg-zinc-950 overflow-hidden flex flex-col">
      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="bg-amber-950/80 border-b border-amber-900/50 text-amber-300 text-xs px-3 py-1.5 flex items-center justify-center gap-2 select-none z-10 backdrop-blur">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>Offline — showing saved messages</span>
        </div>
      )}

      {/* Scrollable Messages Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2 flex flex-col"
      >
        {isUnavailableOffline ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-2 my-auto select-none">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2 shadow-inner text-amber-400">
              <CloudOff className="h-8 w-8" />
            </div>
            <p className="font-semibold text-zinc-300">This conversation isn't available offline yet.</p>
            <p className="text-xs text-zinc-500">Connect to the internet to load and sync messages.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-2 my-auto select-none">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2 shadow-inner">
              <span className="text-3xl">👋</span>
            </div>
            <p className="font-semibold text-zinc-300">No messages here yet</p>
            <p className="text-xs text-zinc-500">Send a message or attachment to start chatting!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isPrevSameSender = idx > 0 && messages[idx - 1].sender_id === msg.sender_id;
            const isNextSameSender = idx < messages.length - 1 && messages[idx + 1].sender_id === msg.sender_id;

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isGroup={isGroup}
                showAvatar={!isNextSameSender}
                showSenderName={!isPrevSameSender}
                isSelectMode={isSelectMode}
                isSelected={selectedMessageIds.has(msg.id)}
                onToggleSelect={toggleSelectMessage}
                onReply={onReply}
                onRetry={handleRetryMessage}
                onCancelUpload={cancelMediaUpload}
                onEdit={onEdit}
                onDelete={(m) => deleteMessage(m.id)}
                onReact={(m, emoji) => user && toggleReaction(m.id, emoji, user.id)}
                onOpenActionSheet={(m) => setActionSheetMessage(m)}
                onScrollToReply={handleScrollToReply}
                allMediaItems={allMediaItems}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Floating "↓ New messages" pill button */}
      {showScrollBottomBtn && (
        <div className="absolute bottom-4 right-4 z-20 animate-bounce select-none">
          <Button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl rounded-full text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 border border-emerald-400/30 cursor-pointer"
          >
            <ArrowDown className="h-4 w-4" />
            <span>New messages</span>
            {unreadCount > 0 && (
              <span className="bg-white text-emerald-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ml-0.5">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Mobile/Desktop Context Message Action Sheet */}
      {actionSheetMessage && (
        <MessageActionSheet
          message={actionSheetMessage}
          isOpen={actionSheetMessage !== null}
          isOwn={actionSheetMessage.sender_id === user?.id}
          onClose={() => setActionSheetMessage(null)}
          onReact={(emoji) => user && toggleReaction(actionSheetMessage.id, emoji, user.id)}
          onReply={() => onReply && onReply(actionSheetMessage)}
          onCopy={() => {
            if (actionSheetMessage.content) {
              navigator.clipboard.writeText(actionSheetMessage.content);
            }
          }}
          onEdit={() => onEdit && onEdit(actionSheetMessage)}
          onForward={() => setForwardMessage(actionSheetMessage)}
          onShare={() => handleShareSingle(actionSheetMessage)}
          onDelete={() => deleteMessage(actionSheetMessage.id)}
          onToggleSelectMode={() => {
            setIsSelectMode(true);
            toggleSelectMessage(actionSheetMessage);
          }}
        />
      )}

      {/* Forward Modal */}
      {forwardMessage && (
        <ForwardModal
          message={forwardMessage}
          isOpen={forwardMessage !== null}
          onClose={() => setForwardMessage(null)}
        />
      )}

      {/* Batch Message Selection Toolbar */}
      {isSelectMode && (
        <MessageSelectionToolbar
          selectedMessages={selectedMessagesList}
          onClearSelection={() => {
            setIsSelectMode(false);
            setSelectedMessageIds(new Set());
          }}
          onCopySelected={handleCopySelected}
          onForwardSelected={() => {
            if (selectedMessagesList.length > 0) {
              setForwardMessage(selectedMessagesList[0]);
            }
          }}
          onDeleteSelected={handleDeleteSelected}
          onShareSelected={handleShareSelected}
        />
      )}
    </div>
  );
}
