import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mockLogs = [
  { id: '1', timestamp: '2023-11-20T10:05:22Z', actor: { name: 'Admin User', avatar: '' }, action: 'API_KEY_CREATED', resourceType: 'ApiKey', resourceId: 'key_123', details: 'Created key "Mobile App"' },
  { id: '2', timestamp: '2023-11-20T09:12:45Z', actor: { name: 'System', avatar: '' }, action: 'USER_DISABLED', resourceType: 'User', resourceId: 'usr_456', details: 'Disabled due to spam reports' },
  { id: '3', timestamp: '2023-11-19T16:30:10Z', actor: { name: 'Admin User', avatar: '' }, action: 'SETTING_CHANGED', resourceType: 'SystemSettings', resourceId: 'rate_limit', details: 'Changed message rate limit from 100 to 50' },
];

export const AdminAuditLogsPage: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur z-10">
          <h2 className="text-xl font-semibold">Audit Logs</h2>
          <Button variant="outline" className="border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/50 text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">Actor</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Resource</th>
                  <th className="px-6 py-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {mockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/20 font-mono text-xs">
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-sans">
                        <UserAvatar name={log.actor.name} size="sm" />
                        <span className="text-zinc-200">{log.actor.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {log.resourceType} <span className="text-zinc-600">({log.resourceId})</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {log.details}
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
