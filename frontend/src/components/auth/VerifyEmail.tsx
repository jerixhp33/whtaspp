import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2 } from 'lucide-react';

export function VerifyEmail({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      
      if (error) throw error;
      
      setMessage("Verification email resent!");
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-zinc-950 border-zinc-800 text-zinc-100">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-emerald-500/20 p-3 rounded-full">
            <Mail className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
        <CardDescription className="text-zinc-400">
          We sent a verification link to <span className="text-white font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-center text-zinc-300">
          Please check your inbox and click the link to verify your account and continue.
        </p>

        {error && <div className="text-sm text-red-500 text-center">{error}</div>}
        {message && <div className="text-sm text-emerald-500 text-center">{message}</div>}

        <Button 
          variant="outline" 
          className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800 hover:text-white"
          onClick={handleResend}
          disabled={loading || countdown > 0}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {countdown > 0 ? `Resend available in ${countdown}s` : "Resend Verification Email"}
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link to="/login" className="text-emerald-500 hover:text-emerald-400 text-sm">
          Return to login
        </Link>
      </CardFooter>
    </Card>
  );
}
