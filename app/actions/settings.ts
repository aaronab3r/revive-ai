'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface SettingsData {
  vapi_private_key: string;
  vapi_public_key: string;
  vapi_assistant_id: string;
  vapi_phone_number_id: string;
  calendar_email: string;
}

export async function getSettings() {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('*')
    .single();

  if (error) {
    console.warn('Error fetching settings:', error.message);
    return null;
  }

  return data;
}

export async function updateSettings(formData: FormData) {
  if (!supabaseAdmin) {
    return { success: false, message: 'Server configuration error' };
  }

  const vapi_private_key = formData.get('vapi_private_key') as string;
  const vapi_public_key = formData.get('vapi_public_key') as string;
  const vapi_assistant_id = formData.get('vapi_assistant_id') as string;
  const vapi_phone_number_id = formData.get('vapi_phone_number_id') as string;
  const calendar_email = formData.get('calendar_email') as string;

  // Matching User's Schema: id=true (bool singleton)
  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({
      id: true, 
      vapi_private_key,
      vapi_public_key,
      vapi_assistant_id,
      vapi_phone_number_id,
      calendar_email
    });

  if (error) {
    console.error('Error updating settings:', error);
    return { success: false, message: 'Failed to update settings' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');

  return { success: true, message: 'Settings Saved' };
}
