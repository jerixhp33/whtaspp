import { Profile } from '@/types';
import { Button } from '@/components/ui/button';

export function BlockedUsers() {
  const blockedUsers: Profile[] = [];

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 p-4">
      <h2 className="text-xl font-semibold mb-2">Blocked Users</h2>
      <p className="text-sm text-zinc-400 mb-6">Blocked users cannot send you messages or see your online status.</p>
      
      <div className="flex-1 overflow-y-auto">
        {blockedUsers.length === 0 ? (
          <div className="text-center p-8 text-zinc-500">
            You haven't blocked anyone.
          </div>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                    <span>{(user.display_name || user.username || '?').charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.display_name || user.username}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
