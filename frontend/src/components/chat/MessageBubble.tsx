import { useState } from 'react';
import { format } from 'date-fns';
import { Message } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { CheckCheck, Reply, Download, FileText, Film, ExternalLink } from 'lucide-react';
import { VoiceMessagePlayer } from '@/components/media/VoiceMessagePlayer';
import { ImageViewer } from '@/components/media/ImageViewer';

interface Props {
  message: Message;
  showAvatar?: boolean;
  onReply?: (msg: Message) => void;
}

export function MessageBubble({ message, showAvatar = true, onReply }: Props) {
  const { user } = useAuth();
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const isOwn = message.sender_id === user?.id;
  const isRead = message.reads && message.reads.length > 0;

  // Attachment data
  const attachment = message.attachments?.[0];
  const fileUrl = attachment?.file_url || message.metadata?.audio_url || message.metadata?.file_url;
  const fileName = attachment?.file_name || message.content || 'File';
  const fileSize = attachment?.file_size;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderContent = () => {
    switch (message.message_type) {
      case 'voice':
      case 'audio':
        return fileUrl ? (
          <VoiceMessagePlayer src={fileUrl} durationSecs={message.metadata?.duration || attachment?.duration} />
        ) : (
          <p className="italic text-zinc-400 text-xs">Audio file unavailable</p>
        );

      case 'image':
        return fileUrl ? (
          <div className="flex flex-col gap-1.5 my-1">
            <div
              onClick={() => setFullscreenImage(fileUrl)}
              className="relative max-w-sm rounded-xl overflow-hidden cursor-pointer group border border-zinc-700/50 shadow-md"
            >
              <img
                src={fileUrl}
                alt={fileName}
                className="w-full max-h-80 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur">
                  Click to view
                </span>
              </div>
            </div>
            {message.content && message.content !== fileName && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        ) : null;

      case 'video':
        return fileUrl ? (
          <div className="flex flex-col gap-1.5 my-1 max-w-sm">
            <video src={fileUrl} controls className="w-full rounded-xl border border-zinc-700/50 max-h-72 object-cover" />
            {message.content && message.content !== fileName && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        ) : null;

      case 'document':
        return (
          <div className="flex flex-col gap-1.5 my-1">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={fileName}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                isOwn
                  ? 'bg-emerald-700/50 border-emerald-500/40 hover:bg-emerald-700/70 text-white'
                  : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-100'
              }`}
            >
              <div className="p-2 rounded-lg bg-zinc-800 shrink-0 text-amber-400">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{fileName}</p>
                {fileSize && <p className="text-[10px] opacity-70">{formatFileSize(fileSize)}</p>}
              </div>
              <div className="p-1.5 rounded-full hover:bg-black/20 shrink-0">
                <Download className="h-4 w-4" />
              </div>
            </a>
            {message.content && message.content !== fileName && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="break-words text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        );
    }
  };

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} group relative my-1`}>
      <div className={`flex max-w-[85%] sm:max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {/* Sender Avatar */}
        {!isOwn && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 overflow-hidden mb-1 border border-zinc-700 flex items-center justify-center">
            {message.sender?.avatar_url ? (
              <img src={message.sender.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-zinc-200">
                {(message.sender?.display_name || message.sender?.username || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
        
        {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} min-w-0`}>
          {!isOwn && showAvatar && message.sender && (
            <span className="text-[11px] text-zinc-400 ml-1 mb-1 font-medium">
              {message.sender.display_name || message.sender.username}
            </span>
          )}
          
          <div
            className={`relative px-3.5 py-2 rounded-2xl shadow-sm ${
              isOwn 
                ? 'bg-emerald-600 text-white rounded-br-xs' 
                : 'bg-zinc-800 text-zinc-100 rounded-bl-xs'
            }`}
          >
            {/* Reply Quote Preview if message is a reply */}
            {message.reply_to && (
              <div className={`p-2 mb-2 rounded-lg text-xs border-l-2 ${isOwn ? 'bg-emerald-700/50 border-l-white text-emerald-100' : 'bg-zinc-900 border-l-emerald-500 text-zinc-300'}`}>
                <p className="font-semibold text-[11px]">
                  {message.reply_to.sender?.display_name || message.reply_to.sender?.username || 'User'}
                </p>
                <p className="truncate opacity-90">{message.reply_to.content}</p>
              </div>
            )}

            {/* Message Content Rendered by Type */}
            {renderContent()}
            
            {/* Timestamp & Read Receipt */}
            <div className={`flex items-center justify-end gap-1 mt-1 -mb-0.5 ${isOwn ? 'text-emerald-200' : 'text-zinc-400'} text-[10px]`}>
              <span>{format(new Date(message.created_at), 'HH:mm')}</span>
              {isOwn && (
                isRead ? (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-400 font-bold" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 opacity-70" />
                )
              )}
            </div>
          </div>
        </div>

        {/* Hover Action: Reply */}
        {onReply && (
          <button 
            type="button"
            onClick={() => onReply(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white self-center"
            title="Reply"
          >
            <Reply className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <ImageViewer src={fullscreenImage} onClose={() => setFullscreenImage(null)} />
      )}
    </div>
  );
}
