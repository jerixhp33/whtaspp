import React, { useState } from 'react';
import { getEmojiSvgUrl } from '@/lib/emoji';

interface Props {
  unicode: string;
  size?: 'sm' | 'md' | 'lg' | 'jumbo';
  className?: string;
}

export function ChatFlowEmoji({ unicode, size = 'md', className = '' }: Props) {
  const [loadFailed, setLoadFailed] = useState(false);
  const svgUrl = getEmojiSvgUrl(unicode);

  const sizeClasses = {
    sm: 'w-4 h-4 inline-block align-text-bottom mx-0.5 select-none',
    md: 'w-5 h-5 inline-block align-text-bottom mx-0.5 select-none',
    lg: 'w-7 h-7 inline-block align-middle mx-1 select-none',
    jumbo: 'w-12 h-12 inline-block align-middle mx-1.5 transform hover:scale-110 transition-transform select-none',
  };

  if (loadFailed) {
    return <span className={`inline-block font-sans ${className}`}>{unicode}</span>;
  }

  return (
    <img
      src={svgUrl}
      alt={unicode}
      draggable={false}
      onError={() => setLoadFailed(true)}
      className={`${sizeClasses[size]} ${className}`}
      loading="lazy"
    />
  );
}
