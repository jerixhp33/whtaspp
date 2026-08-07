import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ContactRequests() {
  const incomingRequests: any[] = [];
  const outgoingRequests: any[] = [];

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 p-4">
      <h2 className="text-xl font-semibold mb-6">Contact Requests</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Incoming ({incomingRequests.length})</h3>
          {incomingRequests.length === 0 ? (
            <p className="text-sm text-zinc-600">No incoming requests</p>
          ) : (
            <div className="space-y-2">
              {incomingRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      {req.user.avatar_url ? (
                        <img src={req.user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span>{req.user.username.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{req.user.display_name || req.user.username}</p>
                      <p className="text-xs text-zinc-500">Wants to connect</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Outgoing ({outgoingRequests.length})</h3>
          {outgoingRequests.length === 0 ? (
            <p className="text-sm text-zinc-600">No outgoing requests</p>
          ) : (
            <div className="space-y-2">
              {outgoingRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <span>{req.user.username.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{req.user.display_name || req.user.username}</p>
                      <p className="text-xs text-zinc-500">Pending</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
