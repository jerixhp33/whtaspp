import { useState } from 'react';
import { Search, Contact } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ContactCardPicker({ onSelect, onCancel }: { onSelect: (contactId: string) => void, onCancel: () => void }) {
  const [search, setSearch] = useState('');
  
  // Mock contacts
  const contacts = [
    { id: '1', name: 'Alice Smith', phone: '+1 234 567 8900' },
    { id: '2', name: 'Bob Jones', phone: '+1 987 654 3210' },
  ];

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-sm overflow-hidden flex flex-col max-h-96">
      <div className="p-3 border-b border-zinc-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Search contacts..." 
            className="pl-8 bg-zinc-900 border-zinc-800 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.map(contact => (
          <div 
            key={contact.id}
            className="flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-lg cursor-pointer"
            onClick={() => onSelect(contact.id)}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Contact className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-100">{contact.name}</p>
              <p className="text-xs text-zinc-500">{contact.phone}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 border-t border-zinc-800 flex justify-end">
        <Button variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-white">Cancel</Button>
      </div>
    </div>
  );
}
