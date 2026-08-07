import { useState } from 'react';
import { X, Search, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateGroupDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">Create Group</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors group">
              <Camera className="h-8 w-8 text-zinc-500 group-hover:text-zinc-400" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name" className="text-zinc-300">Group Name</Label>
              <Input 
                id="group-name" 
                placeholder="E.g. Project Alpha" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="group-desc" className="text-zinc-300">Description (Optional)</Label>
              <textarea 
                id="group-desc" 
                placeholder="What is this group about?" 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none h-20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Add Members</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Search contacts..." 
                className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="mt-2 text-sm text-zinc-500 text-center py-4">
              Select contacts to add them to the group
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-zinc-950/50">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">Cancel</Button>
          <Button disabled={!name.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">Create Group</Button>
        </div>
      </div>
    </div>
  );
}
