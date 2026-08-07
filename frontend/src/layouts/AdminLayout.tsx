import { Outlet } from 'react-router-dom';

export const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <div className="w-64 border-r border-zinc-800 p-4">Admin Sidebar</div>
      <div className="flex-1 p-8 overflow-y-auto"><Outlet /></div>
    </div>
  );
};
