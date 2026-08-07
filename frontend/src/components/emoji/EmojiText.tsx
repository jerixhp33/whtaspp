import React from 'react';
import { UNICODE_EMOJI_REGEX, isEmojiOnlyMessage } from '@/lib/emoji';
import { ChatFlowEmoji } from './ChatFlowEmoji';

interface Props {
  text: string;
  className?: string;
}

export function EmojiText({ text, className = '' }: Props) {
  if (!text) return null;

  const { isEmojiOnly, count } = isEmojiOnlyMessage(text);

  if (isEmojiOnly) {
    const emojis = text.trim().match(UNICODE_EMOJI_REGEX) || [];
    return (
      <div className={`flex items-center gap-1.5 py-1 ${className}`}>
        {emojis.map((emoji, idx) => (
          <ChatFlowEmoji
            key={idx}
            unicode={emoji}
            size={count === 1 ? 'jumbo' : 'lg'}
          />
        ))}
      </div>
    );
  }

  // Split string into text and emoji segments
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  UNICODE_EMOJI_REGEX.lastIndex = 0;

  while ((match = UNICODE_EMOJI_REGEX.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = UNICODE_EMOJI_REGEX.lastIndex;

    // Push preceding text if any
    if (matchStart > lastIndex) {
      parts.push(text.slice(lastIndex, matchStart));
    }

    // Push emoji component
    const emojiUnicode = match[0];
    parts.push(
      <ChatFlowEmoji key={`emoji-${matchStart}`} unicode={emojiUnicode} size="md" />
    );

    lastIndex = matchEnd;
  }

  // Push remaining trailing text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
