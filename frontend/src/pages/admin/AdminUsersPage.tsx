import React, { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { SearchInput } from '@/components/shared/SearchInput';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Shield, ShieldOff, Ban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock Data
const mockUsers = [
  { id: '1', username: 'john_doe', displayName: 'John Doe', email: 'john@example.com', status: 'online', isAdmin: true, isDisabled: false, joinedAt: '2023-01-15T10:00:00Z' },
  { id: '2', username: 'jane_smith', displayName: 'Jane Smith', email: 'jane@example.com', status: 'offline', isAdmin: false, isDisabled: false, joinedAt: '2023-02-20T14:30:00Z' },
  { id: '3', username: 'spammer_123', displayName: 'Spam Bot', email: 'spam@example.com', status: 'offline', isAdmin: false, isDisabled: true, joinedAt: '2023-11-05T09:15:00Z' },
];

export const AdminUsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState(mockUsers);

  const toggleStatus = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isDisabled: !u.isDisabled } : u));
  };

  const toggleAdmin = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u));
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur z-10">
          <h2 className="text-xl font-semibold">User Management</h2>
          <div className="w-64">
            <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/50 text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.displayName} size="sm" isOnline={user.status === 'online'} />
                        <div>
                          <div className="font-medium text-zinc-100">{user.displayName}</div>
                          <div className="text-zinc-500 text-xs">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400 ring-1 ring-inset ring-purple-500/20">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2 py-1 text-xs font-medium text-zinc-400 ring-1 ring-inset ring-zinc-500/20">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.isDisabled ? (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                          Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(user.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md hover:bg-zinc-800 h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200">
                          <DropdownMenuItem onClick={() => toggleAdmin(user.id)} className="focus:bg-zinc-800 cursor-pointer">
                            {user.isAdmin ? <ShieldOff className="mr-2 h-4 w-4" /> : <Shield className="mr-2 h-4 w-4" />}
                            {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(user.id)} className="focus:bg-zinc-800 cursor-pointer text-red-400 focus:text-red-300">
                            <Ban className="mr-2 h-4 w-4" />
                            {user.isDisabled ? 'Enable Account' : 'Disable Account'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};
