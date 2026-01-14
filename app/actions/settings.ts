'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getUser } from '@/lib/supabase/server';

// Service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  const user = await getUser();
  if (!user) return null;

  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.warn('Error fetching settings:', error.message);
    return null;
  }

  return data;
}

export async function updateSettings(formData: FormData) {
  const user = await getUser();
  if (!user) {
    return { success: false, message: 'Not authenticated' };
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
    user_id: user.id,
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

  // Upsert using user_id as the key
  const { data, error } = await supabaseAdmin
    .from('settings')
    .upsert({
      user_id: user.id, 
      vapi_private_key,
      vapi_public_key,
      vapi_assistant_id,
      vapi_phone_number_id,
      calendar_email,
      business_name,
      business_industry,
      agent_name,
      agent_role
    }, { onConflict: 'user_id' })
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
