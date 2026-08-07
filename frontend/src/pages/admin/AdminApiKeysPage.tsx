import React, { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, KeyRound, Copy, RefreshCw, Trash2, Power } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Constants (simulated)
const API_PERMISSIONS = [
  'users:read', 'contacts:read', 'contacts:write', 'conversations:read', 
  'conversations:write', 'messages:read', 'messages:send', 'notifications:send'
];

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  status: 'active' | 'disabled' | 'revoked' | 'expired';
  createdAt: string;
  lastUsed: string | null;
  requestCount: number;
}

export const AdminApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Mobile App Live',
      prefix: 'app_live_xk92',
      permissions: ['users:read', 'messages:read', 'messages:send'],
      status: 'active',
      createdAt: '2023-01-10T00:00:00Z',
      lastUsed: '2023-11-20T14:30:00Z',
      requestCount: 45201
    }
  ]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({ name: '', description: '', permissions: [] as string[] });
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const handleTogglePermission = (perm: string) => {
    setNewKeyData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm) 
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const handleCreate = () => {
    // Simulate API call
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyData.name || 'Unnamed Key',
      prefix: 'app_live_' + Math.random().toString(36).substring(2, 6),
      permissions: newKeyData.permissions,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUsed: null,
      requestCount: 0
    };
    
    setKeys([newKey, ...keys]);
    const mockSecret = `${newKey.prefix}${Math.random().toString(36).substring(2, 20)}`;
    setCreatedSecret(mockSecret);
    setNewKeyData({ name: '', description: '', permissions: [] });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const closeSecretModal = () => {
    setCreatedSecret(null);
    setIsCreateOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur z-10">
          <h2 className="text-xl font-semibold">API Keys</h2>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger>
              <div className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2 cursor-pointer">
                <Plus className="h-4 w-4 mr-2" /> Create API Key
              </div>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-[500px]">
              {createdSecret ? (
                <div className="space-y-6">
                  <DialogHeader>
                    <DialogTitle className="text-emerald-500 flex items-center gap-2">
                      <KeyRound className="h-5 w-5" /> Key Created Successfully
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Please copy this secret key now. You will not be able to see it again!
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="bg-zinc-950 p-4 rounded-lg flex items-center justify-between border border-zinc-800">
                    <code className="text-emerald-400 font-mono text-sm break-all">{createdSecret}</code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdSecret)} className="ml-2 hover:bg-zinc-800">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={closeSecretModal} className="bg-emerald-600 hover:bg-emerald-700">
                      I have copied the key
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <DialogHeader>
                    <DialogTitle>Create New API Key</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Generate a new API key for external integrations.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input 
                        value={newKeyData.name}
                        onChange={(e) => setNewKeyData({...newKeyData, name: e.target.value})}
                        placeholder="e.g., Mobile App Production" 
                        className="bg-zinc-950 border-zinc-800" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Permissions</label>
                      <div className="grid grid-cols-2 gap-2 border border-zinc-800 p-4 rounded-lg bg-zinc-950/50">
                        {API_PERMISSIONS.map(perm => (
                          <label key={perm} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={newKeyData.permissions.includes(perm)}
                              onChange={() => handleTogglePermission(perm)}
                              className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-950"
                            />
                            <span className="text-sm text-zinc-300">{perm}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="hover:bg-zinc-800">Cancel</Button>
                    <Button onClick={handleCreate} disabled={!newKeyData.name} className="bg-emerald-600 hover:bg-emerald-700">
                      Generate Key
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/50 text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Key Prefix</th>
                  <th className="px-6 py-4 font-medium">Permissions</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Last Used</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {keys.map(key => (
                  <tr key={key.id} className="hover:bg-zinc-800/20">
                    <td className="px-6 py-4 font-medium text-zinc-200">{key.name}</td>
                    <td className="px-6 py-4 font-mono text-zinc-400 text-xs">{key.prefix}••••••••</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {key.permissions.slice(0, 2).map(p => (
                          <span key={p} className="inline-block bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 rounded">
                            {p}
                          </span>
                        ))}
                        {key.permissions.length > 2 && (
                          <span className="inline-block bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded">
                            +{key.permissions.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        key.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' :
                        key.status === 'disabled' ? 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20' :
                        'bg-red-500/10 text-red-400 ring-red-500/20'
                      }`}>
                        {key.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" title="Disable/Enable">
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10" title="Rotate Key">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10" title="Revoke Key">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
