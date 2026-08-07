import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const categories = [
    { name: 'Smileys', emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓'] },
    { name: 'Hearts', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝'] },
    { name: 'Hands', emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏'] }
  ];

  return (
    <div className="w-72 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl overflow-hidden flex flex-col h-80">
      <div className="p-3 border-b border-zinc-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Search emojis..." 
            className="h-8 pl-8 bg-zinc-900 border-zinc-800 text-sm text-zinc-100"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {categories.map(cat => (
          <div key={cat.name} className="mb-4">
            <h4 className="text-xs font-semibold text-zinc-500 mb-2 uppercase px-1">{cat.name}</h4>
            <div className="grid grid-cols-6 gap-1">
              {cat.emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => onSelect(emoji)}
                  className="h-8 w-8 flex items-center justify-center text-xl hover:bg-zinc-800 rounded-md transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
