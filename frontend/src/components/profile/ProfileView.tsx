import { Profile } from '@/types';
import { MessageCircle, Phone, Ban, Flag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProfileView({ user, onClose }: { user: Profile, onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 p-4">
      <div className="flex items-center mb-6">
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="mr-2 md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h2 className="text-xl font-semibold">User Profile</h2>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-zinc-900 overflow-hidden mb-4 relative">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-zinc-600">
              {(user.display_name || user.username).charAt(0).toUpperCase()}
            </div>
          )}
          {user.is_online && (
            <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-900"></div>
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-white">{user.display_name || user.username}</h3>
        <p className="text-emerald-500">@{user.username}</p>
        <p className="text-sm text-zinc-400 mt-1">{user.status || (user.is_online ? 'Online' : 'Offline')}</p>
      </div>

      <div className="flex justify-center gap-3 mb-8">
        <Button className="bg-emerald-600 hover:bg-emerald-700 flex-1">
          <MessageCircle className="mr-2 h-4 w-4" /> Message
        </Button>
        <Button variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 flex-1">
          <Phone className="mr-2 h-4 w-4" /> Call
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Bio</h4>
          <p className="text-sm text-zinc-300 bg-zinc-900 p-3 rounded-lg">
            {user.bio || 'No bio provided.'}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Actions</h4>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10">
              <Ban className="mr-3 h-4 w-4" /> Block User
            </Button>
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10">
              <Flag className="mr-3 h-4 w-4" /> Report User
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
