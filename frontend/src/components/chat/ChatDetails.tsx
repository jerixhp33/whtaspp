import { X, Image, FileText, Link as LinkIcon, Bell, Ban, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/useChat';

export function ChatDetails({ onClose }: { onClose?: () => void }) {
  const { activeConversation } = useChat();

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const name = isGroup
    ? (activeConversation.group?.name || 'Group Chat')
    : (activeConversation.members?.[0]?.profile?.display_name || activeConversation.members?.[0]?.profile?.username || 'Private Chat');
  const avatarUrl = isGroup
    ? activeConversation.group?.avatar_url
    : activeConversation.members?.[0]?.profile?.avatar_url;

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800 text-zinc-100 overflow-y-auto">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-950/95 backdrop-blur z-10">
        <h3 className="font-semibold text-lg">Details</h3>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="p-6 flex flex-col items-center border-b border-zinc-800">
        <div className="w-24 h-24 rounded-full bg-zinc-800 mb-4 overflow-hidden">
          {avatarUrl ? (
             <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-medium">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold mb-1">{name}</h2>
        <p className="text-sm text-zinc-400 mb-4">{isGroup ? `Group • ${activeConversation.members?.length || 0} members` : 'Online'}</p>
        
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 mb-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-100">
              <Bell className="h-5 w-5" />
            </Button>
            <span className="text-xs text-zinc-400">Mute</span>
          </div>
          <div className="flex flex-col items-center">
            <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 mb-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-100">
              <Search className="h-5 w-5" />
            </Button>
            <span className="text-xs text-zinc-400">Search</span>
          </div>
          {isGroup && (
            <div className="flex flex-col items-center">
              <Button variant="secondary" size="icon" className="rounded-full h-10 w-10 mb-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-100">
                <UserPlus className="h-5 w-5" />
              </Button>
              <span className="text-xs text-zinc-400">Add</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-zinc-400 uppercase mb-3">Shared Media</h4>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-zinc-900 rounded-md flex items-center justify-center">
                <Image className="h-6 w-6 text-zinc-700" />
              </div>
            ))}
          </div>
          <Button variant="link" className="text-emerald-500 px-0 h-auto mt-2 font-medium">Show all media</Button>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-zinc-400 uppercase mb-3">Shared Files</h4>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3 p-2 bg-zinc-900/50 rounded-lg">
                <FileText className="h-5 w-5 text-emerald-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-100 truncate">Project_Requirements.pdf</p>
                  <p className="text-xs text-zinc-500">2.4 MB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-zinc-400 uppercase mb-3">Shared Links</h4>
          <div className="space-y-2">
            {[1].map(i => (
              <div key={i} className="flex items-center gap-3 p-2 bg-zinc-900/50 rounded-lg">
                <LinkIcon className="h-5 w-5 text-emerald-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-100 truncate">github.com/chatflow/repo</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isGroup && (
          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10">
              <Ban className="mr-2 h-4 w-4" /> Block User
            </Button>
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10">
              <Ban className="mr-2 h-4 w-4" /> Report User
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
