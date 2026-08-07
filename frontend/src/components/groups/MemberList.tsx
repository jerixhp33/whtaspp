import { MoreVertical, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MemberList() {
  const members = [
    { id: 1, name: 'Alice Smith', role: 'admin', isOnline: true },
    { id: 2, name: 'Bob Jones', role: 'member', isOnline: false },
    { id: 3, name: 'Charlie Brown', role: 'member', isOnline: true },
  ];

  return (
    <div className="space-y-1">
      {members.map(member => (
        <div key={member.id} className="flex items-center justify-between p-2 hover:bg-zinc-900/50 rounded-lg group">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <span>{member.name.charAt(0)}</span>
              </div>
              {member.isOnline && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm text-zinc-100 flex items-center gap-2">
                {member.name}
                {member.role === 'admin' && <Shield className="w-3 h-3 text-emerald-500" />}
              </p>
              <p className="text-xs text-zinc-500 capitalize">{member.role}</p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition-opacity h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
