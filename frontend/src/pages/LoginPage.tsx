import { LoginForm } from '@/components/auth/LoginForm';
import { MessageCircle, Shield, Sparkles } from 'lucide-react';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-x-hidden">
      {/* Background ambient glow */}
      <div className="absolute w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -top-32 -left-32"></div>
      <div className="absolute w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -bottom-32 -right-32"></div>

      {/* Brand Header */}
      <div className="mb-6 sm:mb-8 text-center flex flex-col items-center relative z-10 px-4">
        <div className="bg-emerald-500/10 p-3.5 sm:p-4 rounded-2xl mb-3 sm:mb-4 border border-emerald-500/20 shadow-xl shadow-emerald-500/10 flex items-center justify-center">
          <MessageCircle className="h-9 w-9 sm:h-11 sm:w-11 text-emerald-400" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Modern Messenger & Calls</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">ChatFlow</h1>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 max-w-xs sm:max-w-sm leading-relaxed">
          Private, end-to-end encrypted messaging, voice & video calls
        </p>
      </div>

      {/* Main Login Card */}
      <div className="w-full relative z-10">
        <LoginForm />
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5 relative z-10">
        <Shield className="h-3.5 w-3.5 text-zinc-400" />
        <span>ChatFlow &copy; {new Date().getFullYear()} &bull; Built with Supabase & WebRTC</span>
      </div>
    </div>
  );
}
