'use client';

import { useState } from 'react';
import { updateSettings } from '@/app/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface SettingsFormProps {
  initialSettings: any;
  serviceAccountEmail: string;
}

export function SettingsForm({ initialSettings, serviceAccountEmail }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(serviceAccountEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const result = await updateSettings(formData);

    setLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  }

  // Default values from prop or empty string
  const defaults = initialSettings || {};

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>
          Manage your API keys and service integrations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
          
          {/* VAPI Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Vapi Configuration</h3>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="vapi_private_key">Vapi Private Key</Label>
                <Input 
                  id="vapi_private_key"
                  name="vapi_private_key" 
                  type="password" 
                  autoComplete="new-password"
                  defaultValue={defaults.vapi_private_key || ''} 
                />
                <p className="text-xs text-muted-foreground">Used for server-side API calls.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vapi_public_key">Vapi Public Key</Label>
                <Input 
                  id="vapi_public_key"
                  name="vapi_public_key" 
                  type="password" 
                  autoComplete="new-password"
                  defaultValue={defaults.vapi_public_key || ''} 
                />
                <p className="text-xs text-muted-foreground">Used for client-side interactions (if needed).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vapi_assistant_id">Vapi Assistant ID</Label>
                  <Input 
                    id="vapi_assistant_id"
                    name="vapi_assistant_id" 
                    type="text" 
                    defaultValue={defaults.vapi_assistant_id || ''} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vapi_phone_number_id">Vapi Phone Number ID</Label>
                  <Input 
                    id="vapi_phone_number_id"
                    name="vapi_phone_number_id" 
                    type="text" 
                    defaultValue={defaults.vapi_phone_number_id || ''} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Calendar Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Calendar Configuration</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calendar_email">Your Google Calendar Email</Label>
                <Input 
                  id="calendar_email"
                  name="calendar_email" 
                  type="email" 
                  autoComplete="off"
                  defaultValue={defaults.calendar_email || ''} 
                  placeholder="doctor@clinic.com" 
                />
                <p className="text-xs text-muted-foreground">
                  The email address of the Google Calendar where you want appointments to be made.
                </p>
              </div>

              {/* Service Account Copy Box */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                 <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">System Bot Email (Share your Calendar with this email)</Label>
                    <p className="text-xs text-slate-500">
                       Go to your Google Calendar Settings {'>'} "Share with specific people" {'>'} Add this email with "Make changes to events" permission.
                    </p>
                 </div>
                 <div className="flex items-center gap-2">
                    <Input 
                       readOnly 
                       value={serviceAccountEmail} 
                       className="bg-white font-mono text-xs"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                 </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
