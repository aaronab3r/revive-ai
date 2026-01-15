'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/supabase/server';

export async function resetAccount(confirmEmail: string) {
  const user = await getUser();
  if (!user || !user.email) {
    return { success: false, error: 'Not authenticated' };
  }

  if (confirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
    return { success: false, error: 'Email confirmation does not match.' };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Delete all leads for this user
    const { error: leadsError } = await supabase
      .from('leads')
      .delete()
      .eq('user_id', user.id);

    if (leadsError) {
      console.error('Error deleting leads:', leadsError);
      throw new Error('Failed to delete leads');
    }

    // 2. Delete settings for this user (start fresh)
    const { error: settingsError } = await supabase
      .from('settings')
      .delete()
      .eq('user_id', user.id);

    if (settingsError) {
      console.error('Error deleting settings:', settingsError);
      throw new Error('Failed to delete settings');
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Reset account error:', error);
    return { success: false, error: error.message };
  }
}
