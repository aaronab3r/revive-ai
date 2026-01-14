'use client';

import { useState } from 'react';
import { makeCall } from '@/app/actions/make-call';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Loader2, AlertCircle, CheckCircle2, PhoneCall } from 'lucide-react';

interface TestCallCardProps {
  isConfigured: boolean;
}

export function TestCallCard({ isConfigured }: TestCallCardProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleTestCall = async () => {
    if (!name.trim() || !phone.trim()) {
      setResult({ type: 'error', message: 'Please enter your name and phone number.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await makeCall({
        name: name.trim(),
        phone: phone.trim(),
        interest: interest.trim() || 'a follow-up appointment',
      });

      if (response.success) {
        setResult({ 
          type: 'success', 
          message: `📞 Calling you now! Check your phone for a call from your AI assistant.` 
        });
        // Clear form after success
        setName('');
        setPhone('');
        setInterest('');
      } else {
        setResult({ type: 'error', message: response.error });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <PhoneCall className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Test Your AI</CardTitle>
            <CardDescription>
              Try it yourself before calling clients
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigured && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Setup Required</p>
                <p className="text-xs text-amber-600 mt-1">
                  Complete your settings configuration first. Go to Settings → Quick Setup to configure your AI agent.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-slate-500">
          Enter your details below and the AI will call you, just like it would call a real lead.
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="test_name" className="text-sm">Your Name</Label>
            <Input
              id="test_name"
              type="text"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="test_phone" className="text-sm">Your Phone Number</Label>
            <Input
              id="test_phone"
              type="tel"
              placeholder="5551234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="test_interest" className="text-sm">Reason for Call</Label>
            <Input
              id="test_interest"
              type="text"
              placeholder="e.g., dental cleaning, property viewing"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-slate-400">What service should the AI mention?</p>
          </div>
        </div>

        {result && (
          <div className={`p-3 rounded-lg flex items-start gap-2 ${
            result.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {result.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{result.message}</p>
          </div>
        )}

        <Button
          onClick={handleTestCall}
          disabled={isLoading || !name.trim() || !phone.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initiating Call...
            </>
          ) : (
            <>
              <Phone className="mr-2 h-4 w-4" />
              Call Me Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
