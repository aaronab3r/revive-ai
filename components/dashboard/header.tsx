import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HelpCircle, AlertCircle } from 'lucide-react';
import { getSettings } from '@/app/actions/settings';

export async function Header() {
  const settings = await getSettings();
  const db = settings || {};
  const env = process.env;

  const hasKey = db.vapi_private_key || env.VAPI_PRIVATE_KEY;
  const hasAssistant = db.vapi_assistant_id || env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  const hasPhone = db.vapi_phone_number_id || env.VAPI_PHONE_NUMBER_ID;

  const isConfigured = hasKey && hasAssistant && hasPhone;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {isConfigured ? (
          <Badge variant="success" className="gap-1.5 bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            System Online
          </Badge>
        ) : (
           <Badge variant="destructive" className="gap-1.5 bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
            Configuration Missing
          </Badge>
        )}
      </div>
    </header>
  );
}
