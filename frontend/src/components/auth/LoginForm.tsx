import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, Lock, Zap, Video, CheckCircle2 } from 'lucide-react';

export function LoginForm() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      if (err.message?.includes('provider') || err.message?.includes('enabled')) {
        setError('Google login is not enabled in your Supabase Auth settings yet. Please enable Google provider in your Supabase Dashboard.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-zinc-950/95 border-zinc-800 text-zinc-100 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="text-center pb-2 pt-6">
        <CardTitle className="text-2xl font-bold tracking-tight text-white">Sign In to ChatFlow</CardTitle>
        <CardDescription className="text-zinc-400 text-xs sm:text-sm mt-1">
          Instant end-to-end encrypted messaging & HD calling
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Feature Pill Highlights */}
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-center">
            <Lock className="h-4 w-4 text-emerald-400 mb-1" />
            <span className="text-[10px] font-medium text-zinc-300">Encrypted</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-center">
            <Zap className="h-4 w-4 text-emerald-400 mb-1" />
            <span className="text-[10px] font-medium text-zinc-300">Realtime</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-center">
            <Video className="h-4 w-4 text-emerald-400 mb-1" />
            <span className="text-[10px] font-medium text-zinc-300">HD Calls</span>
          </div>
        </div>

        {/* Main Google Login Button */}
        <Button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-sm sm:text-base flex items-center justify-center gap-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-zinc-900" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
        </Button>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center leading-relaxed">
            {error}
          </div>
        )}

        {/* Reassuring Data Privacy Notice */}
        <div className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 text-left space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Strict Privacy Commitment</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            We only access your basic display name, avatar picture, and email address to create your account identity in ChatFlow. Your personal Google files and private data are never accessed or shared.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 pt-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Protected by Google OAuth 2.0 & Supabase Auth</span>
        </div>
      </CardContent>
    </Card>
  );
}
