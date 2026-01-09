'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lead } from '@/types';

interface DashboardChartProps {
  leads: Lead[];
}

export function DashboardChart({ leads }: DashboardChartProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Aggregate data
  const statusCounts: Record<string, number> = {
    'Booked': 0,
    'Voicemail': 0,
    'Contacted': 0,
    'Calling': 0,
    'Pending': 0,
  };

  leads.forEach(lead => {
    const status = lead.status || 'Pending';
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++;
    } else {
      // Handle unknown statuses or capitalize consistently
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }
  });

  const data = Object.keys(statusCounts).map(status => ({
    name: status,
    count: statusCounts[status],
  }));

  // Custom colors for bars
  const getBarColor = (entry: any) => {
    if (entry.name === 'Booked') return '#22c55e'; // Green-500
    if (entry.name === 'Voicemail') return '#ef4444'; // Red-500
    if (entry.name === 'Contacted') return '#3b82f6'; // Blue-500
    if (entry.name === 'Calling') return '#eab308'; // Yellow-500
    return '#64748b'; // Slate-500 for Pending/Other
  };

  return (
    <Card className="col-span-full border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle>Pipeline Overview</CardTitle>
          <CardDescription>Real-time breakdown of call results</CardDescription>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing} 
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}`} 
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  backgroundColor: '#1e293b',
                  color: '#f8fafc'
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
