import { VerifyEmail } from '@/components/auth/VerifyEmail';
import { useSearchParams } from 'react-router-dom';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'your email';

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4">
      <VerifyEmail email={email} />
    </div>
  );
}
