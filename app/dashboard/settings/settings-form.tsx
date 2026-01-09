'use client';

import { useState } from 'react';
import { updateSettings } from '@/app/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SettingsFormProps {
  initialSettings: any;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Vapi Private Key
            </label>
            <Input 
              name="vapi_private_key" 
              type="password" 
              defaultValue={defaults.vapi_private_key || ''} 
            />
            <p className="text-xs text-muted-foreground">Used for server-side API calls.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Vapi Assistant ID
            </label>
            <Input 
              name="vapi_assistant_id" 
              type="password" 
              defaultValue={defaults.vapi_assistant_id || ''} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Vapi Phone Number ID
            </label>
            <Input 
              name="vapi_phone_number_id" 
              type="password" 
              defaultValue={defaults.vapi_phone_number_id || ''} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Google Service Account Email
            </label>
            <Input 
              name="google_service_email" 
              type="password" 
              defaultValue={defaults.calendar_email || ''} 
              placeholder="service-account@project.iam.gserviceaccount.com" 
            />
            <p className="text-xs text-muted-foreground">Ensure this email has access to your calendar.</p>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
