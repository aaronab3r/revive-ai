import { DollarSign, Phone, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: React.ReactNode;
}

function StatsCard({ title, value, icon, description }: StatsCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {description && (
          <div className="text-xs text-slate-500 mt-1">{description}</div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  stats: {
    callsMade: number;
    appointmentsBooked: number;
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  const conversionRate = stats.callsMade > 0 
    ? ((stats.appointmentsBooked / stats.callsMade) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Revenue Reactivated"
        value="$8,500"
        icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
        description={
          <span className="text-emerald-600 font-medium">
            ↑ 12% vs last month
          </span>
        }
      />
      <StatsCard
        title="Calls Made"
        value={stats.callsMade.toLocaleString()}
        icon={<Phone className="h-5 w-5 text-blue-600" />}
        description="Total outbound attempts"
      />
      <StatsCard
        title="Appointments Booked"
        value={stats.appointmentsBooked}
        icon={<CalendarCheck className="h-5 w-5 text-green-600" />}
        description={`${conversionRate}% conversion rate`}
      />
    </div>
  );
}
