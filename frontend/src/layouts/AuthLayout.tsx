import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-lg">
        <h1 className="text-2xl font-bold text-center text-zinc-100 mb-6">ChatFlow</h1>
        <Outlet />
      </div>
    </div>
  );
};
