import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { getSettings } from '@/app/actions/settings';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const businessName = settings?.business_name || 'Your Business';

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar businessName={businessName} />
      <div className="pl-64">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
