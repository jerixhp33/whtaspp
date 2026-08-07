import { useState, useRef, useEffect } from 'react';
import { Paperclip, Smile, Mic, Send, X, Reply } from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { messageService } from '@/services/message.service';
import { Message } from '@/types';
import { supabase } from '@/lib/supabase';
import { VoiceRecorder } from '@/components/media/VoiceRecorder';
import { AttachmentPreview } from './AttachmentPreview';

interface Props {
  replyMessage?: Message | null;
  onClearReply?: () => void;
}

export function MessageComposer({ replyMessage, onClearReply }: Props) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const { activeConversation, sendTypingSignal } = useChat();
  const { user } = useAuth();
  const { uploadFile, progress: uploadProgress, isUploading } = useMediaUpload();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

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
      if (e.key === 'Escape') setShowEmojiPicker(false);
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
    
    if (activeConversation) {
      sendTypingSignal(activeConversation.id, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        sendTypingSignal(activeConversation.id, false);
      }, 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB limit.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText(prev => prev + emojiData.emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + emojiData.emoji + text.substring(end);
    setText(newText);
    
    // Defer setting selection position
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emojiData.emoji.length;
      textarea.focus();
    }, 0);
  };

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || !activeConversation || !user || isUploading) return;
    
    const messageText = text.trim();
    const currentFile = selectedFile;

    // Reset local composer states immediately
    setText('');
    handleRemoveFile();
    if (onClearReply) onClearReply();

    if (activeConversation) {
      sendTypingSignal(activeConversation.id, false);
    }

    try {
      let messageType: any = 'text';
      let fileResult = null;

      if (currentFile) {
        fileResult = await uploadFile(currentFile);
        if (!fileResult) {
          alert('Failed to upload file');
          return;
        }

        if (currentFile.type.startsWith('image/')) messageType = 'image';
        else if (currentFile.type.startsWith('video/')) messageType = 'video';
        else if (currentFile.type.startsWith('audio/')) messageType = 'audio';
        else messageType = 'document';
      }

      const payload: any = {
        content: messageText || (fileResult ? fileResult.file_name : ''),
        message_type: messageType,
        conversation_id: activeConversation.id,
        sender_id: user.id,
      };

      if (replyMessage?.id) {
        payload.reply_to_id = replyMessage.id;
      }

      const { data: msgData, error: msgErr } = await supabase
        .from('messages')
        .insert(payload)
        .select()
        .single();

      if (msgErr || !msgData) throw msgErr;

      // Insert message attachment row if file exists
      if (fileResult) {
        await supabase.from('message_attachments').insert({
          message_id: msgData.id,
          file_name: fileResult.file_name,
          file_type: fileResult.file_type,
          file_size: fileResult.file_size,
          file_url: fileResult.file_url,
        });
      }

      // Update conversation last_message_at timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', activeConversation.id);

    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err.message || 'Failed to send message');
    }
  };

  const handleSendVoice = async (audioBlob: Blob, durationSecs: number) => {
    if (!activeConversation || !user) return;
    setIsVoiceRecording(false);

    try {
      const fileName = `voice_${Date.now()}.webm`;
      const fileResult = await uploadFile(audioBlob, fileName);

      if (!fileResult) {
        alert('Failed to upload voice message');
        return;
      }

      const payload: any = {
        content: `Voice message (${durationSecs}s)`,
        message_type: 'voice',
        conversation_id: activeConversation.id,
        sender_id: user.id,
        metadata: { duration: durationSecs, audio_url: fileResult.file_url }
      };

      const { data: msgData, error: msgErr } = await supabase
        .from('messages')
        .insert(payload)
        .select()
        .single();

      if (msgErr || !msgData) throw msgErr;

      await supabase.from('message_attachments').insert({
        message_id: msgData.id,
        file_name: fileName,
        file_type: 'audio/webm',
        file_size: audioBlob.size,
        file_url: fileResult.file_url,
        duration: durationSecs,
      });

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', activeConversation.id);

    } catch (err: any) {
      console.error('Failed to send voice message:', err);
      alert(err.message || 'Failed to send voice message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex flex-col w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-2 sm:p-2.5 shadow-xl">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
        className="hidden"
      />

      {/* Floating Emoji Picker Popover */}
      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-3 z-50 shadow-2xl rounded-2xl overflow-hidden border border-zinc-800">
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={handleEmojiClick}
            autoFocusSearch={false}
            width={320}
            height={380}
          />
        </div>
      )}

      {/* Voice Recorder Active Mode */}
      {isVoiceRecording ? (
        <VoiceRecorder
          onSend={handleSendVoice}
          onCancel={() => setIsVoiceRecording(false)}
        />
      ) : (
        /* Normal Composer Layout */
        <div className="flex flex-col gap-2">
          {/* Reply Quote Banner */}
          {replyMessage && (
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-950/80 border-l-4 border-l-emerald-500 rounded-lg text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Reply className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-emerald-400 block truncate">
                    Replying to {replyMessage.sender?.display_name || replyMessage.sender?.username || 'User'}
                  </span>
                  <span className="text-zinc-400 block truncate">{replyMessage.content}</span>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={onClearReply} className="h-6 w-6 text-zinc-400 hover:text-white shrink-0">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Selected File Preview Banner */}
          {selectedFile && (
            <AttachmentPreview
              file={selectedFile}
              previewUrl={filePreviewUrl}
              uploadProgress={uploadProgress}
              isUploading={isUploading}
              onRemove={handleRemoveFile}
            />
          )}

          <div className="flex items-end gap-1.5 sm:gap-2">
            {/* Paperclip File Attachment Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0 mb-0.5"
              title="Attach file"
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
                placeholder="Type a message..."
                className="w-full max-h-32 min-h-[40px] bg-transparent border-0 focus:ring-0 resize-none py-2 text-zinc-100 placeholder-zinc-500 text-sm leading-relaxed"
                rows={1}
              />
            </div>

            {/* Emoji Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`shrink-0 mb-0.5 transition-colors ${showEmojiPicker ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              title="Emoji"
            >
              <Smile className="h-5 w-5" />
            </Button>

            {/* Dynamic Send / Mic Button */}
            {text.trim() || selectedFile ? (
              <Button
                type="button"
                size="icon"
                disabled={isUploading}
                onClick={handleSend}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 mb-0.5 rounded-full shadow-md shadow-emerald-600/20 active:scale-95 transition-transform"
                title="Send message"
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
