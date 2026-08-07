import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AddMemberDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">Add Members</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search contacts..." 
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100"
            />
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-center text-sm text-zinc-500 mt-4">
            No contacts available to add
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-zinc-950/50">
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled>Add Selected</Button>
        </div>
      </div>
    </div>
  );
}
