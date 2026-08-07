import React, { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { CheckCircle2, XCircle } from 'lucide-react';

const mockReports = [
  { id: '1', reporter: { name: 'Alice' }, reported: { name: 'Bob' }, reason: 'spam', description: 'Sending links repeatedly', status: 'pending', date: '2023-11-20T10:00:00Z' },
  { id: '2', reporter: { name: 'Charlie' }, reported: { name: 'Dave' }, reason: 'harassment', description: 'Insulting messages', status: 'reviewing', date: '2023-11-19T15:30:00Z' },
  { id: '3', reporter: { name: 'Eve' }, reported: { name: 'Frank' }, reason: 'inappropriate', description: 'Offensive profile picture', status: 'resolved', date: '2023-11-18T09:15:00Z' },
];

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState(mockReports);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 ring-yellow-500/20';
      case 'reviewing': return 'bg-blue-500/10 text-blue-500 ring-blue-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20';
      case 'dismissed': return 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20';
    }
  };

  const updateStatus = (id: string, newStatus: string) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-zinc-800 flex items-center px-8 bg-zinc-950/50 backdrop-blur z-10">
          <h2 className="text-xl font-semibold">User Reports</h2>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/50 text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Reporter</th>
                  <th className="px-6 py-4 font-medium">Reported User</th>
                  <th className="px-6 py-4 font-medium">Reason</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-zinc-800/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={report.reporter.name} size="sm" />
                        <span>{report.reporter.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={report.reported.name} size="sm" />
                        <span>{report.reported.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium text-zinc-200 capitalize">{report.reason}</span>
                        <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">{report.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(report.status)} capitalize`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {report.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => updateStatus(report.id, 'reviewing')} className="h-8 border-zinc-700 bg-transparent hover:bg-zinc-800">
                            Review
                          </Button>
                        )}
                        {(report.status === 'pending' || report.status === 'reviewing') && (
                          <>
                            <Button size="sm" onClick={() => updateStatus(report.id, 'resolved')} className="h-8 bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Resolve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(report.id, 'dismissed')} className="h-8 bg-red-600/10 text-red-500 hover:bg-red-600/20 border-0">
                              <XCircle className="h-4 w-4 mr-1" /> Dismiss
                            </Button>
                          </>
                        )}
                      </div>
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
