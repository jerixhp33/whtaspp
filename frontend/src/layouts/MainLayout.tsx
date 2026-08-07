import { Outlet } from 'react-router-dom';

export const MainLayout = () => {
  return (
    <div className="h-[100dvh] w-full bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col fixed inset-0">
      <Outlet />
    </div>
  );
};
