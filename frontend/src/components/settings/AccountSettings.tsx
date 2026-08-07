import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export const AccountSettings: React.FC = () => {
  const { user, profile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      setMessage("Password updated successfully!");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-lg font-medium text-zinc-100">Account Security & Overview</h3>
        <p className="text-sm text-zinc-400">View account details and update security settings.</p>
      </div>

      <div className="space-y-4 mb-8 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase">Email Address</label>
          <p className="text-zinc-200 font-medium">{user?.email || profile?.email || 'N/A'}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase">Username</label>
          <p className="text-zinc-200 font-medium">@{profile?.username || 'N/A'}</p>
        </div>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-4 mb-12">
        <h4 className="text-md font-medium text-zinc-200 border-b border-zinc-800 pb-2">Change Password</h4>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">New Password</label>
          <Input 
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Confirm New Password</label>
          <Input 
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-zinc-100"
            required
          />
        </div>

        {message && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <div className="pt-2">
          <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Update Password'}
          </Button>
        </div>
      </form>

      <div className="h-px bg-zinc-800 my-8" />

      <div className="border border-red-900/50 rounded-lg p-6 bg-red-950/10">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-red-900/20 text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-lg font-medium text-red-500 mb-1">Danger Zone</h4>
            <p className="text-sm text-zinc-400 mb-4">
              Delete your account and sign out of all active sessions.
            </p>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="Are you sure you want to delete your account and sign out?"
        confirmText="Yes, delete my account"
        confirmVariant="destructive"
      />
    </div>
  );
};
