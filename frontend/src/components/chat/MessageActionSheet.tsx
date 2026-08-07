import { Message } from '@/types';
import {
  Reply,
  Copy,
  Edit2,
  Share2,
  Trash2,
  CheckSquare,
  Forward,
  Download,
  Eye,
  Play,
  X,
} from 'lucide-react';
import { ChatFlowEmoji } from '@/components/emoji/ChatFlowEmoji';
import { mediaService } from '@/services/media.service';

interface Props {
  message: Message | null;
  isOpen: boolean;
  isOwn: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit?: () => void;
  onForward: () => void;
  onShare: () => void;
  onDelete: () => void;
  onToggleSelectMode: () => void;
  onOpenMedia?: () => void;
}

const QUICK_REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '😢', '🎉'];

export function MessageActionSheet({
  message,
  isOpen,
  isOwn,
  onClose,
  onReact,
  onReply,
  onCopy,
  onEdit,
  onForward,
  onShare,
  onDelete,
  onToggleSelectMode,
  onOpenMedia,
}: Props) {
  if (!isOpen || !message) return null;

  const isMedia =
    message.message_type === 'image' ||
    message.message_type === 'video' ||
    message.message_type === 'document' ||
    message.message_type === 'voice';

  const attachment = message.attachments?.[0];
  const rawFileUrl =
    attachment?.file_url || message.metadata?.audio_url || message.metadata?.file_url;
  const fileName =
    attachment?.file_name || (message.message_type !== 'text' ? 'File' : message.content);

  const handleDownload = () => {
    if (!rawFileUrl) return;
    const type =
      message.message_type === 'document'
        ? 'document'
        : message.message_type === 'voice'
        ? 'voice'
        : message.message_type === 'video'
        ? 'video'
        : 'image';
    mediaService.downloadMedia(rawFileUrl, fileName, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 select-none animate-in fade-in duration-150">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Action Sheet Container */}
      <div className="relative z-10 w-full sm:max-w-sm bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        {/* Top Drag Indicator / Header */}
        <div className="pt-3 pb-2 px-4 flex flex-col items-center border-b border-zinc-800/60">
          <div className="w-10 h-1 bg-zinc-700 rounded-full mb-3 sm:hidden" />
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Message Options
            </span>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white rounded-lg"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Reaction Emoji Bar */}
        <div className="p-3 bg-zinc-900/60 border-b border-zinc-800/60 flex items-center justify-around">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(emoji);
                onClose();
              }}
              className="p-2 hover:bg-zinc-800/90 rounded-2xl active:scale-125 transition-transform cursor-pointer"
              title={`React ${emoji}`}
              aria-label={`React with ${emoji}`}
            >
              <ChatFlowEmoji unicode={emoji} size="lg" />
            </button>
          ))}
        </div>

        {/* Action Menu List */}
        <div className="p-2 space-y-0.5 text-sm text-zinc-200">
          {/* Media View/Play action */}
          {isMedia && onOpenMedia && (
            <button
              type="button"
              onClick={() => {
                onOpenMedia();
                onClose();
              }}
              className="w-full px-4 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-3 text-left transition-colors cursor-pointer"
            >
              {message.message_type === 'video' || message.message_type === 'voice' ? (
                <Play className="h-4 w-4 text-emerald-400" />
              ) : (
                <Eye className="h-4 w-4 text-emerald-400" />
              )}
              <span>{message.message_type === 'video' ? 'Play Video' : 'View Fullscreen'}</span>
            </button>
          )}

          {/* Media Download action */}
          {isMedia && rawFileUrl && (
            <button
              type="button"
              onClick={handleDownload}
              className="w-full px-4 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-3 text-left transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Download File</span>
            </button>
          )}

          {/* Reply */}
          <button
            type="button"
            onClick={() => {
              onReply();
              onClose();
            }}
            className="w-full px-4 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-3 text-left transition-colors cursor-pointer"
          >
            <Reply className="h-4 w-4 text-zinc-400" />
            <span>Reply</span>
          </button>

          {/* Copy Text */}
          {message.content && (
            <button
              type="button"
              onClick={() => {
                onCopy();
                onClose();
              }}
              className="w-full px-4 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-3 text-left transition-colors cursor-pointer"
            >
              <Copy className="h-4 w-4 text-zinc-400" />
              <span>Copy Text</span>
            </button>
          )}

          {/* Edit (Own text messages only) */}
          {isOwn && message.message_type === 'text' && onEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit();
                onClose();
              }}
              className="w-full px-4 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-3 text-left transition-colors cursor-pointer"
            >
              <Edit2 className="h-4 w-4 text-sky-400" />
              <span>Edit Message</span>
            </button>
          )}

          {/* Forward */}
          <button
            type="button"
            onClick={() => {
              onForward();
              onClose();
            }}
            className="w-full px-4 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-3 text-left transition-colors cursor-pointer"
          >
            <Forward className="h-4 w-4 text-zinc-400" />
            <span>Forward</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => {
              onShare();
              onClose();
            }}
            className="w-full px-4 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-3 text-left transition-colors cursor-pointer"
          >
            <Share2 className="h-4 w-4 text-zinc-400" />
            <span>Share</span>
          </button>

          {/* Select Messages */}
          <button
            type="button"
            onClick={() => {
              onToggleSelectMode();
              onClose();
            }}
            className="w-full px-4 py-2.5 rounded-xl hover:bg-zinc-900 flex items-center gap-3 text-left transition-colors cursor-pointer"
          >
            <CheckSquare className="h-4 w-4 text-zinc-400" />
            <span>Select Multiple</span>
          </button>

          {/* Delete */}
          {isOwn && (
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="w-full px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center gap-3 text-left transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Message</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
