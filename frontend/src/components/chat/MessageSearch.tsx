import { useState } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function MessageSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  
  return (
    <div className="bg-zinc-950 border-b border-zinc-800 p-2 flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
        <Input 
          autoFocus
          placeholder="Search in conversation..." 
          className="pl-8 bg-zinc-900 border-zinc-800 h-9 text-sm"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-1 text-zinc-500 text-sm">
        <span className="px-2">0 of 0</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-800 hover:text-white">
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-zinc-800 hover:text-white">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="h-4 w-[1px] bg-zinc-700 mx-1"></div>
      
      <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-zinc-800 text-zinc-400 hover:text-white">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
