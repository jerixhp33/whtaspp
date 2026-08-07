import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const AdminRoute = () => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#09090b] flex flex-col items-center justify-center relative overflow-hidden select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
        <div className="relative flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="absolute -inset-1 border-2 border-emerald-500/30 border-t-emerald-500 rounded-3xl animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <div className="flex flex-col items-center space-y-1">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-wide">ChatFlow Admin</h1>
            <div className="flex items-center gap-2 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) return <Navigate to="/" replace />;
  
  return <Outlet />;
};
