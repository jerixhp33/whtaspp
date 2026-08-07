import { Outlet } from 'react-router-dom';

export const MainLayout = () => {
  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col">
      <Outlet />
    </div>
  );
};
