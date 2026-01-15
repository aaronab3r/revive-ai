'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { resetAccount } from '@/app/actions/reset-account';
import { toast } from 'sonner';

interface ResetAccountSectionProps {
  userEmail: string;
}

export function ResetAccountSection({ userEmail }: ResetAccountSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (confirmEmail.toLowerCase() !== userEmail.toLowerCase()) {
      toast.error('Email does not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetAccount(confirmEmail);
      if (result.success) {
        toast.success('Account memory reset successfully');
        setIsOpen(false);
        setConfirmEmail('');
        // Optional: Force reload to reflect empty state
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to reset account');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/10 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            <CardTitle className="text-lg">Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-red-700/80 dark:text-red-400/80">
            Irreversible actions that affect your account data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h4 className="font-medium text-red-900 dark:text-red-300">Delete All Memory</h4>
              <p className="text-sm text-red-700/80 dark:text-red-400/80">
                Permanently remove all leads, voice settings, and business configuration. This allows you to start fresh for demos or new setups.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setIsOpen(true)}
              className="shrink-0"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All Memory
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-semibold text-lg">Are you absolutely sure?</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                This action cannot be undone. It will permanently delete:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>All uploaded leads and contact history</li>
                <li>AI Assistant configuration and voice settings</li>
                <li>Business hours, policies, and knowledge base</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium pt-2">
                Please type <span className="text-red-600 select-all font-bold">{userEmail}</span> to confirm.
              </p>
            </div>

            <Input 
              value={confirmEmail} 
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Enter your email to confirm"
              className="w-full border-red-200 focus-visible:ring-red-500"
              autoFocus
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReset}
                disabled={confirmEmail.toLowerCase() !== userEmail.toLowerCase() || isLoading}
                className="gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? 'Resetting...' : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
