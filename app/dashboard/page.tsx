'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FileUploader } from '@/components/dashboard/file-uploader';
import { LeadsDataTable } from '@/components/dashboard/leads-table';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { DashboardChart } from './dashboard-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockLeads, mockDashboardStats } from '@/lib/mock-data';
import { Lead } from '@/types';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import RealtimeTracker from './components/RealtimeTracker';

export default function DashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importCount, setImportCount] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch initial leads from Supabase
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching leads:', error);
          setLeads(mockLeads); // Fallback to mock data on error
        } else if (data) {
          // Map snake_case DB columns to camelCase types if necessary
          // Assuming DB columns match Lead interface or are aliased in query
          // Here we do a simple cast assuming DB structure matches
           const mappedLeads: Lead[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            phone: item.phone,
            email: item.email,
            status: item.status,
            lastContacted: item.last_contacted ? new Date(item.last_contacted) : null,
            interest: item.interest,
            notes: item.notes,
            createdAt: new Date(item.created_at),
          }));
          setLeads(mappedLeads);
        }
      } catch (e) {
        console.error('Exception fetching leads:', e);
        setLeads(mockLeads);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('realtime_leads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
        },
        (payload) => {
          console.log('Realtime change received!', payload);
          // Re-fetch or optimistically update. Simple re-fetch for accuracy:
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLeadsParsed = (newLeads: Lead[]) => {
     // In a real app, you would upload these to Supabase first
     // For now, we just update local state to show them
    setLeads([...newLeads, ...leads]);
    setImportCount(newLeads.length);
    // Clear the message after 5 seconds
    setTimeout(() => setImportCount(null), 5000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh(); // Refresh Server Components
    // For client-side data (leads state), we could trigger a re-fetch here if we extracted fetchLeads
    // But since this is a mix, router.refresh() handles the server parts.
    // For this specific 'leads' state which is fetched in useEffect, router.refresh won't re-run the effect unless the component unmounts/remounts.
    // Ideally, 'fetchLeads' should be accessible. 
    // However, for the visual feedback requested:
    setTimeout(() => {
      window.location.reload(); // Simple full reload to ensure data consistency as requested
      setIsRefreshing(false);
    }, 500);
  };

  // Calculate dynamic stats
  const callsMade = leads.filter(l => 
    ['Calling', 'Contacted', 'Voicemail', 'Booked'].includes(l.status || '')
  ).length;

  const appointmentsBooked = leads.filter(l => l.status === 'Booked').length;

  const stats = {
    callsMade,
    appointmentsBooked
  };

  return (
    <div className="space-y-8">
      <RealtimeTracker />
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Patient Reactivation
        </h1>
        <p className="mt-1 text-slate-500">
          Upload leads to fill your calendar.
        </p>
      </div>

      {/* Import Notification */}
      {importCount !== null && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          <p>Successfully imported <strong>{importCount}</strong> new leads.</p>
        </div>
      )}

      {/* Stats Grid */}
      <StatsGrid stats={stats} />

      {/* Overview Chart */}
      <DashboardChart leads={leads} />

      {/* Main Content - 2 Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Zone A - File Uploader */}
        <Card className="border-slate-200 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Import Patients</CardTitle>
            <CardDescription>
              Upload your patient list to start the reactivation campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader onLeadsParsed={handleLeadsParsed} />
          </CardContent>
        </Card>

        {/* Zone B - Leads Table */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <div className="space-y-1">
              <CardTitle className="text-lg">Lead Pipeline</CardTitle>
              <CardDescription>
                Track and manage your patient reactivation progress
              </CardDescription>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing} 
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </CardHeader>
          <CardContent>
            <LeadsDataTable data={leads} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
