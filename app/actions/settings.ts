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
  // Business Settings
  business_hours_start?: string;
  business_hours_end?: string;
  avg_appointment_value?: number;
  cancellation_policy?: string;
  custom_knowledge?: string;
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

  // Get current settings to ensure we don't wipe existing valid data with nulls
  // IF we were doing a blind upsert. But here we will build a dynamic object.
  // Actually, upsert in supabase needs all required columns or they default.
  // Safer to use keys.

  const updates: Record<string, any> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  // Helper to add if present
  const addIfPresent = (key: string) => {
    if (formData.has(key)) {
      updates[key] = formData.get(key);
    }
  };

  // Voice Agent Settings
  addIfPresent('vapi_private_key');
  addIfPresent('vapi_public_key');
  addIfPresent('vapi_assistant_id');
  addIfPresent('vapi_phone_number_id');
  addIfPresent('calendar_email');
  addIfPresent('business_name');
  addIfPresent('business_industry');
  addIfPresent('agent_name');
  addIfPresent('agent_role');

  // Business Settings
  addIfPresent('business_hours_start');
  addIfPresent('business_hours_end');
  addIfPresent('cancellation_policy');
  addIfPresent('custom_knowledge');
  
  if (formData.has('avg_appointment_value')) {
    updates['avg_appointment_value'] = Number(formData.get('avg_appointment_value'));
  }

  // Debug logging
  console.log('💾 updateSettings called with updates:', {
    ...updates,
    vapi_private_key: updates.vapi_private_key ? '***set***' : undefined, 
  });

  // We use upsert. Since we might have new columns that are null in DB but not in updates, 
  // we should be careful. 
  // However, partial updates in Supabase via .update() are better if row exists.
  // Let's try .select() first to see if row exists.

  const { data: existing } = await supabaseAdmin
    .from('settings')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let error;
  
  if (existing) {
    const { error: updateError } = await supabaseAdmin
      .from('settings')
      .update(updates)
      .eq('user_id', user.id);
    error = updateError;
  } else {
    // For new user, we might be missing fields if we use the partial 'updates' object
    // But presumably the user fills the main settings first. 
    const { error: insertError } = await supabaseAdmin
      .from('settings')
      .insert(updates);
    error = insertError;
  }

  if (error) {
    console.error('❌ Error updating settings:', error);
    return { success: false, message: `Failed to update settings: ${error.message}` };
  }

  console.log('✅ Settings saved successfully');
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/business-settings');
  revalidatePath('/dashboard'); // Update dashboard for revenue changes
  
  return { success: true, message: 'Settings saved successfully' };
}
