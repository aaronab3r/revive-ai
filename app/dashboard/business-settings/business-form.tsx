'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateSettings } from '@/app/actions/settings';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, DollarSign, FileText, Info } from 'lucide-react';

interface BusinessFormProps {
  initialSettings: any;
}

export function BusinessForm({ initialSettings }: BusinessFormProps) {
  const [loading, setLoading] = useState(false);

  const defaults = initialSettings || {};

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await updateSettings(formData);

    setLoading(false);

    if (response?.success) {
      toast.success('Business settings saved successfully');
    } else {
      toast.error(response?.message || 'Failed to save settings');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl">
      
      {/* Revenue Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <CardTitle>Business Revenue</CardTitle>
          </div>
          <CardDescription>
            Help us calculate your ROI by estimating the value of each appointment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="avg_appointment_value">Average Appointment Value ($)</Label>
              <Input
                id="avg_appointment_value"
                name="avg_appointment_value"
                type="number"
                defaultValue={defaults.avg_appointment_value || 150}
                placeholder="150"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                We use this to calculate "Revenue Recovered" on your dashboard.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <CardTitle>Business Hours</CardTitle>
          </div>
          <CardDescription>
            When are you open for appointments? The AI will use this to suggest times.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_hours_start">Opening Time</Label>
              <Input
                id="business_hours_start"
                name="business_hours_start"
                type="time"
                defaultValue={defaults.business_hours_start || '09:00'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_hours_end">Closing Time</Label>
              <Input
                id="business_hours_end"
                name="business_hours_end"
                type="time"
                defaultValue={defaults.business_hours_end || '17:00'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies & Knowledge */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <CardTitle>Policies & Knowledge Base</CardTitle>
          </div>
          <CardDescription>
            Teach your AI agent about your specific business rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
            <Textarea
              id="cancellation_policy"
              name="cancellation_policy"
              rows={3}
              defaultValue={defaults.cancellation_policy || 'Please provide at least 24 hours notice for cancellations.'}
              placeholder="e.g. We require 24 hours notice for all cancellations."
            />
            <p className="text-xs text-muted-foreground">
              The AI will inform customers of this policy when booking.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom_knowledge">Custom Knowledge Base / FAQs</Label>
            <Textarea
              id="custom_knowledge"
              name="custom_knowledge"
              rows={5}
              defaultValue={defaults.custom_knowledge || ''}
              placeholder={`e.g.
Q: Do you accept insurance?
A: Yes, we accept Blue Cross and Aetna.

Q: Where do I park?
A: There is a free lot behind the building.`}
            />
            <p className="text-xs text-muted-foreground">
              Add any specific Q&A pairs or instructions you want the AI to know.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="w-full md:w-auto">
          {loading ? 'Saving Changes...' : 'Save Business Settings'}
        </Button>
      </div>
    </form>
  );
}
