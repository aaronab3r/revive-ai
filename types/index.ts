export type LeadStatus = 'Pending' | 'Calling' | 'Contacted' | 'Booked' | 'Voicemail' | 'Failed';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  lastContacted: Date | null;
  interest?: string;
  notes?: string;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  leads: Lead[];
  totalCalls: number;
  appointmentsBooked: number;
  revenueRecovered: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalRevenueRecovered: number;
  callsMade: number;
  appointmentsBooked: number;
}

export interface FileUploadState {
  file: File | null;
  isReady: boolean;
  error: string | null;
}

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}
