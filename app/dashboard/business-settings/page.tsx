import { getSettings } from '@/app/actions/settings';
import { BusinessForm } from './business-form';

export default async function BusinessSettingsPage() {
  const settings = await getSettings();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Business Settings</h1>
        <p className="mt-1 text-slate-500">
          Customize your business details, hours, and policies.
        </p>
      </div>
      <div>
        <BusinessForm initialSettings={settings} />
      </div>
    </div>
  );
}
