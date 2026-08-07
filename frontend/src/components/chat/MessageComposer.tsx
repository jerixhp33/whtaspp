import { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Mic, Send, X, Reply, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/types';
import { VoiceRecorder } from '@/components/media/VoiceRecorder';
import { ChatFlowEmojiPicker } from '@/components/emoji/ChatFlowEmojiPicker';
import { AttachmentMenu } from './AttachmentMenu';
import { PreSendMediaModal } from '@/components/media/PreSendMediaModal';

interface Props {
  replyMessage?: Message | null;
  editingMessage?: Message | null;
  onClearReply?: () => void;
  onClearEdit?: () => void;
  onSendMessage: (
    content: string,
    messageType?: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'document',
    fileAttachment?: { file_name: string; file_url: string; file_size?: number; file_type?: string },
    replyTo?: Message | null
  ) => void;
  onSendMediaMessage?: (
    file: File | Blob,
    messageType: 'image' | 'video' | 'audio' | 'voice' | 'document',
    caption?: string,
    replyTo?: Message | null
  ) => void;
  onSaveEdit?: (messageId: string, newContent: string) => void;
}

export function MessageComposer({
  replyMessage,
  editingMessage,
  onClearReply,
  onClearEdit,
  onSendMessage,
  onSendMediaMessage,
  onSaveEdit,
}: Props) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [pendingPreviewFiles, setPendingPreviewFiles] = useState<File[]>([]);
  const [showPreSendModal, setShowPreSendModal] = useState(false);

  const { activeConversation, sendTypingSignal } = useChat();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Sync editing message into composer input
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '');
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(140, Math.max(40, textarea.scrollHeight))}px`;
  }, [text]);

  // Click outside listener for Emoji Picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        setShowAttachmentMenu(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showEmojiPicker]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    if (activeConversation && navigator.onLine) {
      sendTypingSignal(activeConversation.id, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        sendTypingSignal(activeConversation.id, false);
      }, 2000);
    }
  };

  const handleSelectFilesFromMenu = (files: File[]) => {
    setPendingPreviewFiles(files);
    setShowPreSendModal(true);
  };

  const handleSendMediaBatch = (items: { file: File; caption: string; rotation: number }[]) => {
    items.forEach((item) => {
      let type: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (item.file.type.startsWith('image/')) type = 'image';
      else if (item.file.type.startsWith('video/')) type = 'video';
      else if (item.file.type.startsWith('audio/')) type = 'audio';

      if (onSendMediaMessage) {
        onSendMediaMessage(item.file, type, item.caption, replyMessage);
      } else {
        onSendMessage(item.caption || item.file.name, type, undefined, replyMessage);
      }
    });

    if (onClearReply) onClearReply();
    setPendingPreviewFiles([]);
    setShowPreSendModal(false);
  };

  const handleSelectEmoji = (unicode: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + unicode);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + unicode + text.substring(end);
    setText(newText);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + unicode.length;
      textarea.focus();
    }, 0);
  };

  const handleSendText = () => {
    if (!text.trim() || !activeConversation) return;

    // If in editing mode, trigger edit save
    if (editingMessage && onSaveEdit) {
      onSaveEdit(editingMessage.id, text.trim());
      setText('');
      if (onClearEdit) onClearEdit();
      return;
    }

    const messageText = text.trim();
    setText('');
    if (onClearReply) onClearReply();

    if (activeConversation && navigator.onLine) {
      sendTypingSignal(activeConversation.id, false);
    }

    onSendMessage(messageText, 'text', undefined, replyMessage);
  };

  const handleSendVoice = async (audioBlob: Blob, durationSecs: number) => {
    if (!activeConversation) return;
    setIsVoiceRecording(false);

    if (onSendMediaMessage) {
      onSendMediaMessage(
        audioBlob,
        'voice',
        `Voice message (${durationSecs}s)`,
        replyMessage
      );
    } else {
      onSendMessage(`Voice message (${durationSecs}s)`, 'voice', undefined, replyMessage);
    }

    if (onClearReply) onClearReply();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="relative flex flex-col w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-2 sm:p-2.5 shadow-xl select-none">
      {/* Pre-Send Media Preview Modal */}
      {showPreSendModal && pendingPreviewFiles.length > 0 && (
        <PreSendMediaModal
          isOpen={showPreSendModal}
          files={pendingPreviewFiles}
          onClose={() => {
            setShowPreSendModal(false);
            setPendingPreviewFiles([]);
          }}
          onSend={handleSendMediaBatch}
        />
      )}

      {/* Attachment Popover / Bottom Sheet */}
      <AttachmentMenu
        isOpen={showAttachmentMenu}
        onClose={() => setShowAttachmentMenu(false)}
        onSelectFiles={handleSelectFilesFromMenu}
      />

      {/* Floating Custom ChatFlow Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full right-0 sm:right-4 mb-3 z-50 shadow-2xl rounded-2xl overflow-hidden"
        >
          <ChatFlowEmojiPicker
            onSelectEmoji={handleSelectEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Voice Recorder Active Mode */}
      {isVoiceRecording ? (
        <VoiceRecorder onSend={handleSendVoice} onCancel={() => setIsVoiceRecording(false)} />
      ) : (
        /* Normal Composer Layout */
        <div className="flex flex-col gap-2">
          {/* Editing Message Banner */}
          {editingMessage && (
            <div className="flex items-center justify-between px-3 py-2 bg-sky-950/50 border-l-4 border-l-sky-500 rounded-lg text-xs">
              <div className="min-w-0">
                <span className="font-semibold text-sky-400 block">Editing message</span>
                <span className="text-zinc-400 block truncate">{editingMessage.content}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setText('');
                  if (onClearEdit) onClearEdit();
                }}
                className="h-6 w-6 text-zinc-400 hover:text-white shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Reply Quote Banner */}
          {replyMessage && !editingMessage && (
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-950/80 border-l-4 border-l-emerald-500 rounded-lg text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Reply className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-emerald-400 block truncate">
                    Replying to{' '}
                    {replyMessage.sender?.display_name || replyMessage.sender?.username || 'Someone'}
                  </span>
                  <span className="text-zinc-400 block truncate">{replyMessage.content}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClearReply}
                className="h-6 w-6 text-zinc-400 hover:text-white shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          <div className="flex items-end gap-1.5 sm:gap-2">
            {/* Paperclip File Attachment Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className={`shrink-0 mb-0.5 transition-colors ${
                showAttachmentMenu
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Attach media"
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            {/* Multiline Text Input */}
            <div className="flex-1 min-w-0 relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={navigator.onLine ? 'Type a message...' : 'Offline — messages will queue...'}
                className="w-full max-h-32 min-h-[40px] bg-transparent border-0 focus:ring-0 resize-none py-2 text-zinc-100 placeholder-zinc-500 text-sm leading-relaxed selectable-text"
                rows={1}
              />
            </div>

            {/* Emoji Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`shrink-0 mb-0.5 transition-colors ${
                showEmojiPicker
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Emoji"
              aria-label="Emoji picker"
            >
              <Smile className="h-5 w-5" />
            </Button>

            {/* Dynamic Send / Edit Save / Mic Button */}
            {editingMessage ? (
              <Button
                type="button"
                size="icon"
                onClick={handleSendText}
                className="bg-sky-600 hover:bg-sky-700 text-white shrink-0 mb-0.5 rounded-full shadow-md active:scale-95 transition-transform"
                title="Save edit"
                aria-label="Save edited message"
              >
                <Check className="h-4 w-4" />
              </Button>
            ) : text.trim() ? (
              <Button
                type="button"
                size="icon"
                onClick={handleSendText}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 mb-0.5 rounded-full shadow-md shadow-emerald-600/20 active:scale-95 transition-transform"
                title="Send message"
                aria-label="Send message"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                onClick={() => setIsVoiceRecording(true)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white shrink-0 mb-0.5 rounded-full transition-transform active:scale-95"
                title="Voice recording"
                aria-label="Record voice note"
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
