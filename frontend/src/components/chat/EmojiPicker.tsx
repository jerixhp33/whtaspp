import { ChatFlowEmojiPicker } from '@/components/emoji/ChatFlowEmojiPicker';

export function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose?: () => void }) {
  return <ChatFlowEmojiPicker onSelectEmoji={onSelect} onClose={onClose} />;
}
