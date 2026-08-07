import React from 'react';
import { 
  Users, 
  UserCheck, 
  MessageSquare, 
  MessagesSquare, 
  Phone, 
  AlertTriangle, 
  Activity 
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const StatCard = ({ icon: Icon, label, value, trend }: any) => (
  <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-zinc-800 rounded-lg">
        <Icon className="h-5 w-5 text-emerald-500" />
      </div>
      {trend && (
        <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-2xl font-bold text-zinc-100">{value}</h3>
    <p className="text-sm text-zinc-400 mt-1">{label}</p>
  </div>
);

export const AdminDashboard: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100">
      <AdminSidebar />
      
      <div className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-zinc-800 flex items-center px-8 bg-zinc-950/50 backdrop-blur sticky top-0 z-10">
          <h2 className="text-xl font-semibold">Dashboard Overview</h2>
        </header>

        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={Users} label="Total Users" value="12,450" trend={5.2} />
            <StatCard icon={UserCheck} label="Active Users (24h)" value="3,842" trend={-1.4} />
            <StatCard icon={MessageSquare} label="Total Messages" value="1.2M" trend={12.5} />
            <StatCard icon={MessagesSquare} label="Total Conversations" value="45,210" trend={3.1} />
            <StatCard icon={Users} label="Total Groups" value="1,840" trend={0.5} />
            <StatCard icon={Phone} label="Total Calls" value="8,542" trend={8.4} />
            <StatCard icon={AlertTriangle} label="Pending Reports" value="24" trend={-15.0} />
            <StatCard icon={Activity} label="API Requests (24h)" value="452K" trend={4.2} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-4">Activity Overview</h3>
              <div className="h-64 flex items-center justify-center border border-dashed border-zinc-800 rounded-lg">
                <span className="text-zinc-500">Chart Placeholder (Use Recharts)</span>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-zinc-200">User <span className="font-medium text-emerald-400">@john_doe</span> reported an issue</p>
                      <p className="text-zinc-500 text-xs mt-0.5">10 minutes ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
