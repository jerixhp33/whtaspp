import { LoginForm } from '@/components/auth/LoginForm';
import { MessageCircle } from 'lucide-react';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -top-32 -left-32"></div>
      <div className="absolute w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -bottom-32 -right-32"></div>

      <div className="mb-8 text-center flex flex-col items-center relative z-10">
        <div className="bg-emerald-500/10 p-4 rounded-2xl mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <MessageCircle className="h-10 w-10 text-emerald-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">ChatFlow</h1>
        <p className="text-zinc-400 text-base max-w-sm">
          Next-generation personal messaging and calling application
        </p>
      </div>

      <div className="w-full relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}
