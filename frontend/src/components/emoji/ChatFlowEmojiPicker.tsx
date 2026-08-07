import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Clock, Smile, Sparkles, Coffee, Trophy, Plane, Lightbulb, Heart, Flag } from 'lucide-react';
import {
  CHATFLOW_EMOJIS,
  EMOJI_CATEGORIES,
  EmojiCategory,
  getRecentEmojis,
  saveRecentEmoji,
} from '@/lib/emoji';
import { ChatFlowEmoji } from './ChatFlowEmoji';

interface Props {
  onSelectEmoji: (unicode: string) => void;
  onClose?: () => void;
}

const CATEGORY_ICONS: Record<EmojiCategory, any> = {
  recent: Clock,
  smileys: Smile,
  animals: Sparkles,
  food: Coffee,
  activities: Trophy,
  travel: Plane,
  objects: Lightbulb,
  symbols: Heart,
  flags: Flag,
};

export function ChatFlowEmojiPicker({ onSelectEmoji, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRecentEmojis(getRecentEmojis());
  }, []);

  const handleEmojiClick = (unicode: string) => {
    saveRecentEmoji(unicode);
    setRecentEmojis(getRecentEmojis());
    onSelectEmoji(unicode);
  };

  // Filtered emojis based on search query
  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return CHATFLOW_EMOJIS.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.keywords && e.keywords.some((k) => k.toLowerCase().includes(q)))
    );
  }, [searchQuery]);

  return (
    <div className="flex flex-col w-[320px] sm:w-[360px] h-[380px] bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Search Header */}
      <div className="p-2.5 border-b border-zinc-800/60 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-zinc-900/90 rounded-xl px-3 py-1.5 border border-zinc-800/80">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji..."
            className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-zinc-500 hover:text-zinc-300 p-0.5"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            aria-label="Close emoji picker"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-zinc-800/40 bg-zinc-900/30 overflow-x-auto scrollbar-none">
          {EMOJI_CATEGORIES.map((cat) => {
            const IconComponent = CATEGORY_ICONS[cat.id];
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  const el = document.getElementById(`emoji-cat-${cat.id}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`p-2 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
                title={cat.label}
                aria-label={cat.label}
              >
                <IconComponent className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 space-y-4">
        {searchQuery ? (
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2 px-1">
              Search Results ({filteredEmojis?.length || 0})
            </span>
            {filteredEmojis && filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-7 gap-1">
                {filteredEmojis.map((emoji) => (
                  <button
                    key={emoji.id}
                    type="button"
                    onClick={() => handleEmojiClick(emoji.unicode)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-zinc-800/80 active:scale-90 transition-transform cursor-pointer"
                    title={emoji.name}
                    aria-label={emoji.name}
                  >
                    <ChatFlowEmoji unicode={emoji.unicode} size="md" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500">No emojis found</div>
            )}
          </div>
        ) : (
          <>
            {/* Recently Used Section */}
            {recentEmojis.length > 0 && (
              <div id="emoji-cat-recent">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2 px-1">
                  Recently Used
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {recentEmojis.map((unicode, idx) => (
                    <button
                      key={`recent-${idx}`}
                      type="button"
                      onClick={() => handleEmojiClick(unicode)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-zinc-800/80 active:scale-90 transition-transform cursor-pointer"
                      aria-label="Recent emoji"
                    >
                      <ChatFlowEmoji unicode={unicode} size="md" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categorized Emojis */}
            {EMOJI_CATEGORIES.filter((c) => c.id !== 'recent').map((cat) => {
              const catEmojis = CHATFLOW_EMOJIS.filter((e) => e.category === cat.id);
              if (catEmojis.length === 0) return null;

              return (
                <div key={cat.id} id={`emoji-cat-${cat.id}`}>
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2 px-1">
                    {cat.label}
                  </span>
                  <div className="grid grid-cols-7 gap-1">
                    {catEmojis.map((emoji) => (
                      <button
                        key={emoji.id}
                        type="button"
                        onClick={() => handleEmojiClick(emoji.unicode)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-zinc-800/80 active:scale-90 transition-transform cursor-pointer"
                        title={emoji.name}
                        aria-label={emoji.name}
                      >
                        <ChatFlowEmoji unicode={emoji.unicode} size="md" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
