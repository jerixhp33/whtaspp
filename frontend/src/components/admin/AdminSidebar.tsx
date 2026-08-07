import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Flag, 
  Key, 
  ScrollText, 
  Settings,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
// Note: Assuming react-router is used. If not, swap NavLink with normal button/a tags
import { NavLink, Link } from 'react-router-dom';

export const AdminSidebar: React.FC = () => {
  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/reports', icon: Flag, label: 'Reports' },
    { to: '/admin/api-keys', icon: Key, label: 'API Keys' },
    { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-500" />
          ChatFlow Admin
        </h1>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive 
                ? "bg-emerald-500/10 text-emerald-500" 
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <Link 
          to="/" 
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          Back to Chat
        </Link>
      </div>
    </div>
  );
};
