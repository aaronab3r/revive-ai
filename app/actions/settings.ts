'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export interface SettingsData {
  vapi_private_key: string;
  vapi_public_key: string;
  vapi_assistant_id: string;
  vapi_phone_number_id: string;
  calendar_email: string;
  // Business customization
  business_name: string;
  business_industry: string;
  agent_name: string;
  agent_role: string;
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
  
  // Business customization fields
  const business_name = formData.get('business_name') as string;
  const business_industry = formData.get('business_industry') as string;
  const agent_name = formData.get('agent_name') as string;
  const agent_role = formData.get('agent_role') as string;

  // Debug logging
  console.log('💾 updateSettings called with:', {
    business_name,
    business_industry,
    agent_name,
    agent_role,
    vapi_private_key: vapi_private_key ? '***set***' : '***empty***',
    vapi_public_key: vapi_public_key ? '***set***' : '***empty***',
    vapi_assistant_id,
    vapi_phone_number_id,
    calendar_email,
  });

  // Matching User's Schema: id=true (bool singleton)
  const { data, error } = await supabaseAdmin
    .from('settings')
    .upsert({
      id: true, 
      vapi_private_key,
      vapi_public_key,
      vapi_assistant_id,
      vapi_phone_number_id,
      calendar_email,
      business_name,
      business_industry,
      agent_name,
      agent_role
    })
    .select();

  if (error) {
    console.error('❌ Error updating settings:', error);
    return { success: false, message: `Failed to update settings: ${error.message}` };
  }

  console.log('✅ Settings saved successfully:', data);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');

  return { success: true, message: 'Settings Saved' };
}
