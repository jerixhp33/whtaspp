import { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Mic, Send, X, Reply, Check, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { Message } from '@/types';
import { VoiceRecorder } from '@/components/media/VoiceRecorder';
import { ChatFlowEmojiPicker } from '@/components/emoji/ChatFlowEmojiPicker';
import { AttachmentMenu } from './AttachmentMenu';
import { PreSendMediaModal } from '@/components/media/PreSendMediaModal';
import { EmojiText } from '@/components/emoji/EmojiText';

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
    replyTo?: Message | null,
    duration?: number
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
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Sync editing message into composer input
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.content || '');
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Auto-resize textarea and sync scroll
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(140, Math.max(40, textarea.scrollHeight))}px`;
    
    // Sync overlay scroll height if overflow occurs
    if (overlayRef.current) {
      overlayRef.current.scrollTop = textarea.scrollTop;
    }
  }, [text]);

  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

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
  const preventFocusLoss = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
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
        replyMessage,
        durationSecs
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
    <div className="relative flex flex-col w-full select-none gap-2">
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
          className="absolute bottom-full left-0 sm:left-4 mb-3 z-50 shadow-2xl rounded-2xl overflow-hidden"
        >
          <ChatFlowEmojiPicker
            onSelectEmoji={handleSelectEmoji}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Voice Recorder Active Mode */}
      {isVoiceRecording ? (
        <div className="bg-zinc-900 rounded-full border border-zinc-800 p-2 sm:p-2.5 shadow-xl">
          <VoiceRecorder onSend={handleSendVoice} onCancel={() => setIsVoiceRecording(false)} />
        </div>
      ) : (
        /* Normal Composer Layout */
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            {/* Pill Container */}
            <div className="flex-1 flex flex-col bg-[#1f2c34] rounded-3xl border-0 shadow-sm min-h-[44px] overflow-hidden">
              
              {/* Editing Message Banner */}
              {editingMessage && (
                <div className="flex items-center justify-between px-3 py-2 bg-sky-950/50 border-l-4 border-l-sky-500 text-xs mx-1 mt-1 rounded-xl">
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
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-l-4 border-l-emerald-500 text-xs mx-1 mt-1 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="min-w-0">
                      <span className="font-semibold text-emerald-400 block truncate">
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

              {/* Input Row */}
              <div className="flex items-end gap-1.5 sm:gap-2 px-1 py-1">
                {/* Emoji Button (Left) */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`shrink-0 mb-0.5 h-10 w-10 transition-colors ${
                  showEmojiPicker
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                } rounded-full`}
                title="Emoji"
                aria-label="Emoji picker"
              >
                <Smile className="h-6 w-6" />
              </Button>

              {/* Multiline Text Input Container */}
              <div className="flex-1 min-w-0 relative">
                {/* Visual Overlay for Custom Emoji Rendering */}
                <div 
                  ref={overlayRef}
                  className="absolute inset-0 pointer-events-none py-3 text-[17px] leading-snug whitespace-pre-wrap break-words overflow-hidden"
                  style={{ paddingRight: '0.25rem', paddingLeft: '0.125rem' }}
                  aria-hidden="true"
                >
                  {text && <EmojiText text={text + (text.endsWith('\n') ? ' ' : '')} animate={true} forceSize="md" />}
                </div>
                
                {/* Actual Editable Textarea (Transparent) */}
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onScroll={handleScroll}
                  placeholder={navigator.onLine ? 'Message' : 'Offline'}
                  className="w-full max-h-[120px] min-h-[44px] bg-transparent border-0 outline-none focus:outline-none focus:ring-0 resize-none py-3 text-transparent caret-white placeholder-zinc-400 text-[17px] leading-snug selection:bg-emerald-500/40 selection:text-transparent overflow-y-auto"
                  rows={1}
                  style={{ paddingRight: '0.25rem', paddingLeft: '0.125rem' }}
                  spellCheck={false}
                />
              </div>

              {/* Attachment Button (Right) */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className={`shrink-0 mb-0.5 h-10 w-10 transition-colors ${
                  showAttachmentMenu
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                } rounded-full`}
                title="Attach media"
                aria-label="Attach file"
              >
                <Paperclip className="h-5 w-5 -rotate-45" />
              </Button>

              {/* Camera Button (Only if empty text) */}
              {!text.trim() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 mb-0.5 h-10 w-10 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full mr-1"
                  title="Camera"
                >
                  <Camera className="h-5 w-5" />
                </Button>
              )}
            </div>
            </div>

            {/* External Circular Button (Mic or Send) */}
            <div className="shrink-0 mb-0.5">
              {editingMessage ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={handleSendText}
                  className="bg-white hover:bg-zinc-200 text-zinc-950 h-[48px] w-[48px] rounded-full shadow-lg active:scale-95 transition-transform"
                  title="Save edit"
                  aria-label="Save edited message"
                >
                  <Check className="h-6 w-6" />
                </Button>
              ) : text.trim() ? (
                <Button
                  type="button"
                  size="icon"
                  onClick={handleSendText}
                  onMouseDown={preventFocusLoss}
                  onTouchStart={preventFocusLoss}
                  className="bg-white hover:bg-zinc-200 text-zinc-950 h-[48px] w-[48px] rounded-full shadow-lg active:scale-95 transition-transform"
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  onClick={() => setIsVoiceRecording(true)}
                  className="bg-white hover:bg-zinc-200 text-zinc-950 h-[48px] w-[48px] rounded-full shadow-lg active:scale-95 transition-transform"
                  title="Voice recording"
                  aria-label="Record voice note"
                >
                  <Mic className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
