import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HelpCircle, AlertCircle, LogOut } from 'lucide-react';
import { getSettings } from '@/app/actions/settings';
import { signOut } from '@/app/actions/auth';
import { getUser } from '@/lib/supabase/server';

export async function Header() {
  const settings = await getSettings();
  const user = await getUser();
  const db = settings || {};
  const env = process.env;

  const hasKey = db.vapi_private_key || env.VAPI_PRIVATE_KEY;
  const hasAssistant = db.vapi_assistant_id || env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  const hasPhone = db.vapi_phone_number_id || env.VAPI_PHONE_NUMBER_ID;

  const isConfigured = hasKey && hasAssistant && hasPhone;
  
  // Get business info for display
  const businessName = db.business_name || 'Your Business';
  const agentName = db.agent_name || 'AI Agent';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">{businessName}</span>
          <span className="text-xs text-slate-500">{agentName} • AI Assistant</span>
        </div>
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
      
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-slate-500">{user.email}</span>
        )}
        <form action={signOut}>
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
