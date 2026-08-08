import React from 'react';
import { UNICODE_EMOJI_REGEX, isEmojiOnlyMessage } from '@/lib/emoji';
import { ChatFlowEmoji } from './ChatFlowEmoji';

interface Props {
  text: string;
  className?: string;
  animate?: boolean;
  forceSize?: 'sm' | 'md' | 'lg' | 'xl' | 'jumbo';
}

export function EmojiText({ text, className = '', animate = false, forceSize }: Props) {
  if (!text) return null;

  const { isEmojiOnly, count } = isEmojiOnlyMessage(text);

  if (isEmojiOnly && !forceSize) {
    const emojis = text.trim().match(UNICODE_EMOJI_REGEX) || [];
    const size = (count === 1 ? 'jumbo' : count <= 3 ? 'xl' : 'lg');
    return (
      <div className={`flex items-center flex-wrap justify-start py-1 ${className}`}>
        {emojis.map((emoji, idx) => (
          <ChatFlowEmoji
            key={`${idx}-${emoji}`}
            unicode={emoji}
            size={size}
            animate={animate}
            continuousAnimation={count === 1}
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
      <ChatFlowEmoji 
        key={`emoji-${matchStart}-${emojiUnicode}`} 
        unicode={emojiUnicode} 
        size={forceSize || "md"} 
        animate={animate} 
      />
    );

    lastIndex = matchEnd;
  }

  // Push remaining trailing text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
