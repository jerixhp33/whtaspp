import React, { useState } from 'react';
import { getEmojiSvgUrl } from '@/lib/emoji';

interface Props {
  unicode: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'jumbo';
  className?: string;
  animate?: boolean;
}

export function ChatFlowEmoji({ unicode, size = 'md', className = '', animate = false }: Props) {
  const [loadFailed, setLoadFailed] = useState(false);
  const svgUrl = getEmojiSvgUrl(unicode);

  const sizeClasses = {
    sm: 'w-4 h-4 inline-block align-text-bottom mx-[1px] select-none',
    md: 'w-5 h-5 inline-block align-text-bottom mx-[1.5px] select-none',
    lg: 'w-[34px] h-[34px] inline-block align-middle mx-[2px] select-none',
    xl: 'w-[42px] h-[42px] inline-block align-middle mx-[2px] select-none',
    jumbo: 'w-12 h-12 inline-block align-middle mx-[2px] select-none',
  };

  const animationClass = animate ? 'animate-emoji-pop opacity-0' : '';

  if (loadFailed) {
    return <span className={`inline-block font-sans ${className}`}>{unicode}</span>;
  }

  return (
    <img
      src={svgUrl}
      alt={unicode}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onError={() => setLoadFailed(true)}
      className={`${sizeClasses[size]} ${animationClass} ${className} select-none`}
      style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
      loading="lazy"
    />
  );
}
