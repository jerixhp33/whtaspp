import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Message } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  Check,
  CheckCheck,
  Clock,
  Reply,
  Download,
  FileText,
  Smile,
  Trash2,
  Edit2,
  Copy,
  AlertCircle,
  RotateCw,
  MoreHorizontal,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileCode,
  Archive,
  FileBox,
} from 'lucide-react';
import { VoiceMessagePlayer } from '@/components/media/VoiceMessagePlayer';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { MediaViewerModal, MediaViewerItem } from '@/components/media/MediaViewerModal';
import { DocumentViewerModal } from '@/components/media/DocumentViewerModal';
import { LinkPreviewCard, extractFirstUrl } from '@/components/media/LinkPreviewCard';
import { CircularProgressRing } from '@/components/media/CircularProgressRing';
import { mediaService } from '@/services/media.service';
import { EmojiText } from '@/components/emoji/EmojiText';
import { ChatFlowEmoji } from '@/components/emoji/ChatFlowEmoji';
import { isEmojiOnlyMessage } from '@/lib/emoji';

interface Props {
  message: Message;
  isGroup?: boolean;
  showAvatar?: boolean;
  showSenderName?: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (msg: Message) => void;
  onReply?: (msg: Message) => void;
  onRetry?: (msg: Message) => void;
  onCancelUpload?: (msgId: string) => void;
  onEdit?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onReact?: (msg: Message, emoji: string) => void;
  onOpenActionSheet?: (msg: Message) => void;
  onScrollToReply?: (replyId: string) => void;
  allMediaItems?: MediaViewerItem[];
}

const EMOJI_REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '😢'];

export function MessageBubble({
  message,
  isGroup = false,
  showAvatar = true,
  showSenderName = false,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onReply,
  onRetry,
  onCancelUpload,
  onEdit,
  onDelete,
  onReact,
  onOpenActionSheet,
  onScrollToReply,
  allMediaItems = [],
}: Props) {
  const { user } = useAuth();
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Signed media URL state for images
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageOfflineUnavailable, setImageOfflineUnavailable] = useState(false);

  const longPressTimer = useRef<any>(null);
  const isOwn = message.sender_id === user?.id;
  const isRead = message.reads && message.reads.length > 0;
  const isDeleted = message.is_deleted;
  const isPending = (message as any).is_pending;
  const isFailed = (message as any).is_failed;
  const isUploading = message.uploadStatus === 'uploading' || message.uploadStatus === 'preparing' || message.uploadStatus === 'queued';
  const uploadProgress = message.uploadProgress ?? 0;

  // Attachment data
  const attachment = message.attachments?.[0];
  const rawFileUrl = message.localPreviewUrl || attachment?.file_url || message.metadata?.audio_url || message.metadata?.file_url;
  const fileName = attachment?.file_name || (message.message_type !== 'text' ? 'File' : message.content);
  const fileSize = attachment?.file_size;

  // Resolve signed image URL when message type is image
  useEffect(() => {
    if (message.message_type !== 'image' || !rawFileUrl) return;

    // If local object preview URL, use immediately
    if (rawFileUrl.startsWith('blob:') || rawFileUrl.startsWith('data:')) {
      setResolvedImageUrl(rawFileUrl);
      return;
    }

    let active = true;
    setImageLoading(true);
    setImageOfflineUnavailable(false);

    mediaService.getSignedUrl(rawFileUrl, 'message-media').then((url) => {
      if (!active) return;
      if (url) {
        setResolvedImageUrl(url);
      } else if (!navigator.onLine) {
        setImageOfflineUnavailable(true);
      } else {
        setResolvedImageUrl(rawFileUrl);
      }
      setImageLoading(false);
    });

    return () => {
      active = false;
    };
  }, [rawFileUrl, message.message_type]);

  const handleCopyText = async () => {
    if (message.content) {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const isEmojiOnly = message.message_type === 'text' && !isDeleted && isEmojiOnlyMessage(message.content || '').isEmojiOnly;

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      if (onOpenActionSheet) {
        onOpenActionSheet(message);
      } else {
        setShowReactionsMenu(true);
      }
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenActionSheet) {
      onOpenActionSheet(message);
    }
  };

  const handleDownloadAttachment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rawFileUrl) return;
    const type = message.message_type === 'document' ? 'document' : 'file';
    mediaService.downloadMedia(rawFileUrl, fileName || 'file', type, 'documents');
  };

  // Check for URL inside text messages
  const detectedUrl = message.message_type === 'text' && !isDeleted ? extractFirstUrl(message.content) : null;

  // Media items list for fullscreen gallery
  const activeMediaList: MediaViewerItem[] =
    allMediaItems.length > 0
      ? allMediaItems
      : rawFileUrl
      ? [
          {
            id: message.id,
            url: resolvedImageUrl || rawFileUrl,
            type: message.message_type === 'video' ? 'video' : 'image',
            fileName: fileName || 'media',
            senderName: message.sender?.display_name || message.sender?.username,
            createdAt: message.created_at,
          },
        ]
      : [];

  const mediaIndex = activeMediaList.findIndex((m) => m.id === message.id || m.url === rawFileUrl);

  const getDocumentIcon = (name: string) => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return <FileText className="h-6 w-6 text-red-400" />;
    if (['doc', 'docx'].includes(ext)) return <FileText className="h-6 w-6 text-blue-400" />;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="h-6 w-6 text-emerald-400" />;
    if (['ppt', 'pptx'].includes(ext)) return <FileBox className="h-6 w-6 text-orange-400" />;
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return <Archive className="h-6 w-6 text-purple-400" />;
    if (['js', 'ts', 'py', 'json', 'html', 'css'].includes(ext)) return <FileCode className="h-6 w-6 text-cyan-400" />;
    return <FileText className="h-6 w-6 text-amber-400" />;
  };

  const renderContent = () => {
    if (isDeleted) {
      return (
        <p className="italic text-zinc-400 text-xs py-0.5 select-none">
          🚫 This message was deleted
        </p>
      );
    }

    switch (message.message_type) {
      case 'voice':
      case 'audio':
        return rawFileUrl ? (
          <div className="relative">
            <VoiceMessagePlayer
              src={rawFileUrl}
              durationSecs={message.metadata?.duration || attachment?.duration}
              fileName={fileName || 'Voice Message'}
            />
            {isUploading && (
              <div className="absolute top-2 right-2">
                <CircularProgressRing
                  progress={uploadProgress}
                  size={24}
                  onCancel={onCancelUpload ? () => onCancelUpload(message.id) : undefined}
                />
              </div>
            )}
          </div>
        ) : (
          <p className="italic text-zinc-400 text-xs select-none">Audio file unavailable</p>
        );

      case 'image':
        if (imageOfflineUnavailable) {
          return (
            <div className="flex items-center gap-2 p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs text-zinc-400 max-w-xs select-none">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Connect to the internet to view this image.</span>
            </div>
          );
        }

        return rawFileUrl ? (
          <div className="flex flex-col gap-1.5 my-1">
            <div
              onClick={() => !isUploading && setFullscreenOpen(true)}
              className="relative max-w-sm rounded-xl overflow-hidden cursor-pointer group border border-zinc-700/50 shadow-md bg-zinc-900/60"
            >
              {imageLoading && !rawFileUrl.startsWith('blob:') ? (
                <div className="w-64 h-48 flex items-center justify-center bg-zinc-900 animate-pulse text-xs text-zinc-500">
                  Loading image...
                </div>
              ) : (
                <img
                  src={resolvedImageUrl || rawFileUrl}
                  alt="Chat media"
                  loading="lazy"
                  className="w-full max-h-80 object-cover group-hover:scale-102 transition-transform duration-200"
                />
              )}

              {/* Upload Progress Overlay Ring */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                  <CircularProgressRing
                    progress={uploadProgress}
                    size={40}
                    onCancel={onCancelUpload ? () => onCancelUpload(message.id) : undefined}
                  />
                </div>
              )}

              {!isUploading && (
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center select-none">
                  <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur">
                    View Fullscreen
                  </span>
                </div>
              )}
            </div>
            {message.content && message.content !== fileName && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap selectable-text">
                <EmojiText text={message.content} />
              </div>
            )}
          </div>
        ) : null;

      case 'video':
        return rawFileUrl ? (
          <div className="flex flex-col gap-1.5 my-1 max-w-sm relative">
            <VideoPlayer
              src={rawFileUrl}
              fileName={fileName || 'Video'}
              onOpenFullscreen={() => !isUploading && setFullscreenOpen(true)}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                <CircularProgressRing
                  progress={uploadProgress}
                  size={44}
                  onCancel={onCancelUpload ? () => onCancelUpload(message.id) : undefined}
                />
              </div>
            )}
            {message.content && message.content !== fileName && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap selectable-text">
                <EmojiText text={message.content} />
              </div>
            )}
          </div>
        ) : null;

      case 'document':
        return (
          <div className="flex flex-col gap-1.5 my-1">
            <div
              onClick={() => !isUploading && setDocumentViewerOpen(true)}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer group/doc ${
                isOwn
                  ? 'bg-emerald-700/50 border-emerald-500/40 hover:bg-emerald-700/70 text-white'
                  : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-100'
              }`}
            >
              <div className="p-2 rounded-lg bg-zinc-800/80 shrink-0 group-hover/doc:scale-105 transition-transform">
                {getDocumentIcon(fileName || '')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate selectable-text">{fileName}</p>
                <div className="flex items-center gap-2 text-[10px] opacity-75 font-mono select-none">
                  {fileSize && <span>{mediaService.formatFileSize(fileSize)}</span>}
                  <span className="text-emerald-400 font-sans group-hover/doc:underline">Click to preview</span>
                </div>
              </div>

              {isUploading ? (
                <div className="p-1 shrink-0">
                  <CircularProgressRing
                    progress={uploadProgress}
                    size={28}
                    onCancel={onCancelUpload ? () => onCancelUpload(message.id) : undefined}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadAttachment}
                  aria-label="Download document"
                  className="p-1.5 rounded-full hover:bg-black/30 shrink-0 cursor-pointer text-white transition-colors"
                  title="Download document"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
            </div>
            {message.content && message.content !== fileName && (
              <div className="text-sm leading-relaxed whitespace-pre-wrap selectable-text">
                <EmojiText text={message.content} />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className={`break-words text-sm leading-relaxed whitespace-pre-wrap ${isEmojiOnly ? 'text-center' : ''}`}>
            <span className="selectable-text">
              <EmojiText text={message.content || ''} />
            </span>
            {message.is_edited && (
              <span className="text-[10px] opacity-60 ml-1.5 select-none">(edited)</span>
            )}
            {detectedUrl && <LinkPreviewCard url={detectedUrl} />}
          </div>
        );
    }
  };

  // Status Indicator
  const renderStatus = () => {
    if (!isOwn) return null;

    if (isFailed) {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <span className="text-[10px]">Upload failed</span>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="p-0.5 hover:text-white rounded flex items-center gap-0.5 text-[9px] underline"
              title="Retry sending"
            >
              <RotateCw className="h-2.5 w-2.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      );
    }

    if (isUploading) {
      return (
        <div className="flex items-center gap-1 text-emerald-300">
          <span className="text-[9px] font-mono">Uploading {uploadProgress}%</span>
        </div>
      );
    }

    if (isPending) {
      return (
        <div className="flex items-center gap-0.5 text-zinc-400" title="Pending — sending when back online">
          <Clock className="w-3 h-3 animate-pulse" />
          <span className="text-[9px]">Pending</span>
        </div>
      );
    }

    if (isRead) {
      return (
        <span title="Read">
          <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
        </span>
      );
    }
    
    if (message.status === 'delivered') {
      return (
        <span title="Delivered">
          <CheckCheck className="w-3.5 h-3.5 opacity-80" />
        </span>
      );
    }

    return (
      <span title="Sent">
        <CheckCheck className="w-3.5 h-3.5 opacity-80" />
      </span>
    );
  };

  const senderNameClean = (() => {
    const raw = message.sender?.display_name || message.sender?.username;
    if (!raw || raw.toLowerCase() === 'user') return '';
    return raw;
  })();

  const replySenderNameClean = (() => {
    const raw = message.reply_to?.sender?.display_name || message.reply_to?.sender?.username;
    if (!raw || raw.toLowerCase() === 'user') return 'Message';
    return raw;
  })();

  return (
    <div
      id={`message-${message.id}`}
      className={`flex w-full ${
        isOwn ? 'justify-end' : 'justify-start'
      } group relative my-0.5 transition-colors ${
        isSelected ? 'bg-emerald-500/10 rounded-xl p-1 -m-1' : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
    >
      {/* Multi-Select Checkbox */}
      {isSelectMode && (
        <button
          type="button"
          onClick={() => onToggleSelect && onToggleSelect(message)}
          className="mr-2 self-center p-1 text-emerald-400 hover:text-emerald-300 shrink-0"
          aria-label="Select message"
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 fill-emerald-500 text-black" />
          ) : (
            <Square className="h-5 w-5 text-zinc-500" />
          )}
        </button>
      )}

      <div
        className={`flex max-w-[88%] sm:max-w-[75%] ${
          isOwn ? 'flex-row-reverse' : 'flex-row'
        } items-end gap-1.5`}
      >
        {/* Sender Avatar in Group Chat */}
        {!isOwn && isGroup && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden mb-1 border border-zinc-700 flex items-center justify-center select-none">
            {message.sender?.avatar_url ? (
              <img src={message.sender.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-zinc-200">
                {(senderNameClean || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}

        {!isOwn && isGroup && !showAvatar && <div className="w-8 flex-shrink-0" />}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} min-w-0`}>
          {/* Sender name only on first message of cluster in group chat */}
          {!isOwn && isGroup && showSenderName && senderNameClean && (
            <span className="text-[11px] text-zinc-400 ml-1 mb-1 font-medium select-none">
              {senderNameClean}
            </span>
          )}

          <div
            className={`relative shadow-sm ${
              isEmojiOnly
                ? 'bg-transparent py-1 shadow-none rounded-2xl'
                : `px-3 py-1.5 text-[15px] leading-snug ${
                    isOwn
                      ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-[#202c33] text-zinc-100 rounded-2xl rounded-tl-sm'
                  }`
            }`}
          >
            {/* Reply Quote Preview if message is a reply */}
            {message.reply_to && message.reply_to.content && (
              <div
                onClick={() =>
                  message.reply_to?.id && onScrollToReply && onScrollToReply(message.reply_to.id)
                }
                className={`p-2 mb-2 rounded-lg text-xs border-l-2 select-none cursor-pointer transition-opacity hover:opacity-90 ${
                  isOwn
                    ? 'bg-emerald-700/50 border-l-white text-emerald-100'
                    : 'bg-zinc-900 border-l-emerald-500 text-zinc-300'
                }`}
              >
                <p className="font-semibold text-[11px]">
                  {replySenderNameClean}
                </p>
                <div className="truncate opacity-90 text-[11px]"><EmojiText text={message.reply_to.content || ''} /></div>
              </div>
            )}

            {/* Message Content */}
            {renderContent()}

            {/* Timestamp & Status */}
            <div
              className={`flex items-center justify-end gap-1 mt-1 -mb-0.5 select-none ${
                isOwn ? (isEmojiOnly ? 'text-zinc-400' : 'text-emerald-200') : 'text-zinc-400'
              } text-[10px]`}
            >
              <span>{format(new Date(message.created_at || Date.now()), 'HH:mm')}</span>
              {renderStatus()}
            </div>
          </div>

          {/* Reactions bar */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1 px-1 select-none">
              {message.reactions.map((r, i) => (
                <span
                  key={i}
                  className="bg-zinc-900/80 border border-zinc-800 px-1.5 py-0.5 rounded-full shadow-sm flex items-center"
                >
                  <ChatFlowEmoji unicode={r.emoji} size="sm" />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Bar (Hover on desktop) */}
        {!isDeleted && !isSelectMode && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center gap-1 self-center bg-zinc-900/90 border border-zinc-800 px-1.5 py-1 rounded-full shadow-lg select-none z-10">
            {/* Copy Button */}
            {message.content && (
              <button
                type="button"
                onClick={handleCopyText}
                aria-label="Copy message"
                className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
                title="Copy text"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Reply Button */}
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(message)}
                aria-label="Reply to message"
                className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
                title="Reply"
              >
                <Reply className="h-3.5 w-3.5" />
              </button>
            )}

            {/* React Button */}
            {onReact && (
              <button
                type="button"
                onClick={() => setShowReactionsMenu(!showReactionsMenu)}
                aria-label="Add reaction"
                className="p-1 text-zinc-400 hover:text-amber-400 rounded-full hover:bg-zinc-800 transition-colors"
                title="React"
              >
                <Smile className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Edit Button */}
            {isOwn && onEdit && message.message_type === 'text' && (
              <button
                type="button"
                onClick={() => onEdit(message)}
                aria-label="Edit message"
                className="p-1 text-zinc-400 hover:text-sky-400 rounded-full hover:bg-zinc-800 transition-colors"
                title="Edit"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Delete Button */}
            {isOwn && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(message)}
                aria-label="Delete message"
                className="p-1 text-zinc-400 hover:text-red-400 rounded-full hover:bg-zinc-800 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Action Sheet Menu Trigger */}
            {onOpenActionSheet && (
              <button
                type="button"
                onClick={() => onOpenActionSheet(message)}
                aria-label="More actions"
                className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
                title="More"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Emoji Reaction Selector */}
      {showReactionsMenu && (
        <div className="absolute top-0 transform -translate-y-full mb-1 flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-full shadow-2xl z-20 animate-in fade-in zoom-in-90 duration-150">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                if (onReact) onReact(message, emoji);
                setShowReactionsMenu(false);
              }}
              className="p-1.5 hover:scale-125 transition-transform"
            >
              <ChatFlowEmoji unicode={emoji} size="sm" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Media Viewer Modal (Images & Videos) */}
      {fullscreenOpen && (
        <MediaViewerModal
          items={activeMediaList}
          initialIndex={mediaIndex >= 0 ? mediaIndex : 0}
          isOpen={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
        />
      )}

      {/* Document / PDF In-App Viewer Modal */}
      {documentViewerOpen && rawFileUrl && (
        <DocumentViewerModal
          isOpen={documentViewerOpen}
          onClose={() => setDocumentViewerOpen(false)}
          fileUrl={rawFileUrl}
          fileName={fileName || 'Document'}
          fileSize={fileSize}
        />
      )}
    </div>
  );
}
