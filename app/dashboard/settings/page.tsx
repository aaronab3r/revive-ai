import { getSettings } from '@/app/actions/settings';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const settings = await getSettings();
  
  // Extract Service Account Email safely
  let serviceAccountEmail = '';
  try {
    const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}';
    const creds = JSON.parse(jsonString);
    // Ensure we get the full email without any truncation
    serviceAccountEmail = (creds.client_email || '').trim();
  } catch (e) {
    console.error('Failed to parse Service Account JSON', e);
  }

  // Ensure settings is a clean object with no env var fallbacks
  const cleanSettings = settings ? {
    vapi_private_key: settings.vapi_private_key || '',
    vapi_public_key: settings.vapi_public_key || '',
    vapi_assistant_id: settings.vapi_assistant_id || '',
    vapi_phone_number_id: settings.vapi_phone_number_id || '',
    calendar_email: settings.calendar_email || '',
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Update your application connection settings.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <SettingsForm initialSettings={cleanSettings} serviceAccountEmail={serviceAccountEmail} />
      </div>
    </div>
  );
}
