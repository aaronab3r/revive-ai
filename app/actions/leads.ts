'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/supabase/server';

interface LeadInput {
  name: string;
  phone: string;
  interest?: string;
  notes?: string;
}

export async function uploadLeads(leads: LeadInput[]) {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Add user_id to each lead, only include fields that exist in the database
  const leadsWithUserId = leads.map(lead => ({
    name: lead.name,
    phone: lead.phone,
    interest: lead.interest || null,
    notes: lead.notes || null,
    user_id: user.id,
    status: 'Pending',
  }));

  const { data, error } = await supabase
    .from('leads')
    .upsert(leadsWithUserId, { onConflict: 'phone,user_id' })
    .select();

  if (error) {
    console.error('Error uploading leads:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, count: data?.length || 0, leads: data };
}

export async function deleteLead(leadId: string) {
  // Input validation - ensure leadId exists and is not empty
  if (!leadId || leadId.trim() === '') {
    return { success: false, error: 'Invalid lead ID' };
  }

  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting lead:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteAllLeads() {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting all leads:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
