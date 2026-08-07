import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Server, Database, ShieldAlert, Activity } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-zinc-800 flex items-center px-8 bg-zinc-950/50 backdrop-blur z-10">
          <h2 className="text-xl font-semibold">System Settings</h2>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl space-y-8">
            
            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">System Status</p>
                  <p className="text-lg font-semibold text-emerald-400">Operational</p>
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Active WebSocket Cons</p>
                  <p className="text-lg font-semibold text-zinc-100">3,452</p>
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Storage Used</p>
                  <p className="text-lg font-semibold text-zinc-100">485 GB</p>
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800">
                <h3 className="text-lg font-medium text-zinc-100 mb-1">Rate Limiting</h3>
                <p className="text-sm text-zinc-400">Configure global rate limits to prevent abuse.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-zinc-200">Messages per minute</label>
                    <p className="text-sm text-zinc-500">Max messages a user can send per minute</p>
                  </div>
                  <Input type="number" defaultValue={60} className="w-24 bg-zinc-950 border-zinc-700" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-zinc-200">API Requests per hour</label>
                    <p className="text-sm text-zinc-500">Max requests per API key</p>
                  </div>
                  <Input type="number" defaultValue={1000} className="w-24 bg-zinc-950 border-zinc-700" />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">Save Configuration</Button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-900/50 bg-red-950/10 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-red-900/30">
                <h3 className="text-lg font-medium text-red-500 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" /> Danger Zone
                </h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-zinc-200">Maintenance Mode</label>
                    <p className="text-sm text-zinc-500 max-w-md">
                      Enable maintenance mode to disable all non-admin logins and show a maintenance page to users. Current active sessions will be terminated.
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};
