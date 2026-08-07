import { Camera, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function GroupSettings() {
  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 p-4">
      <h2 className="text-xl font-semibold mb-6">Group Settings</h2>
      
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
            <span className="text-2xl font-bold">G</span>
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-emerald-600 rounded-full text-white hover:bg-emerald-700 transition-colors border-4 border-zinc-950">
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="space-y-2">
          <Label className="text-zinc-300">Group Name</Label>
          <Input 
            defaultValue="Engineering Team" 
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Description</Label>
          <textarea 
            defaultValue="Frontend and backend engineers." 
            className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none h-20"
          />
        </div>
        <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">Save Changes</Button>
      </div>

      <div className="mt-auto pt-4 border-t border-zinc-800">
        <Button variant="ghost" className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 justify-start">
          <LogOut className="w-4 h-4 mr-2" />
          Leave Group
        </Button>
      </div>
    </div>
  );
}
