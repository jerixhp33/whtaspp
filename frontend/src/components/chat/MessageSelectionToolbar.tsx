import { Message } from '@/types';
import { Copy, Forward, Trash2, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  selectedMessages: Message[];
  onClearSelection: () => void;
  onCopySelected: () => void;
  onForwardSelected: () => void;
  onDeleteSelected: () => void;
  onShareSelected: () => void;
}

export function MessageSelectionToolbar({
  selectedMessages,
  onClearSelection,
  onCopySelected,
  onForwardSelected,
  onDeleteSelected,
  onShareSelected,
}: Props) {
  const count = selectedMessages.length;
  if (count === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-zinc-100 select-none animate-in fade-in slide-in-from-bottom-3">
      <div className="flex items-center gap-2 pr-2 border-r border-zinc-800">
        <button
          onClick={onClearSelection}
          className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          aria-label="Cancel selection"
        >
          <X className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-emerald-400">
          {count} {count === 1 ? 'message' : 'messages'} selected
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopySelected}
          className="text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 px-2.5 py-1.5 h-auto flex items-center gap-1.5"
          title="Copy selected messages"
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Copy</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onForwardSelected}
          className="text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 px-2.5 py-1.5 h-auto flex items-center gap-1.5"
          title="Forward selected messages"
        >
          <Forward className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Forward</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onShareSelected}
          className="text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 px-2.5 py-1.5 h-auto flex items-center gap-1.5"
          title="Share selected messages"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDeleteSelected}
          className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1.5 h-auto flex items-center gap-1.5"
          title="Delete selected messages"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>
    </div>
  );
}
