import { getSettings } from '@/app/actions/settings';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Update your application connection settings.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <SettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
