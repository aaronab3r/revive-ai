'use server';

interface MakeCallInput {
  name: string;
  phone: string;
  interest?: string;
}

interface MakeCallSuccess {
  success: true;
  data: {
    id: string;
    status: string;
    customer: {
      number: string;
      name: string;
    };
  };
}

interface MakeCallError {
  success: false;
  error: string;
}

type MakeCallResult = MakeCallSuccess | MakeCallError;

/**
 * Sanitizes a phone number to E.164 format.
 * - If already starts with +, return as-is
 * - If 10 digits, prepend +1 (US/Canada)
 * - If 11 digits starting with 1, prepend +
 */
function sanitizePhoneToE164(phone: string): string {
  // Remove all non-digit characters except leading +
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');

  if (hasPlus) {
    return `+${digits}`;
  }

  // 10 digits: assume US/Canada, prepend +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // 11 digits starting with 1: assume US/Canada with country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Default: prepend + and hope for the best
  return `+${digits}`;
}

/**
 * Validates that the phone number is in valid E.164 format
 */
function isValidE164(phone: string): boolean {
  // E.164: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

import { createClient } from '@supabase/supabase-js';

// ... (existing interfaces)

export async function makeCall(input: MakeCallInput): Promise<MakeCallResult> {
  const { name, phone, interest = 'general services' } = input;
  
  // Validate inputs
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Name is required' };
  }

  if (!phone || phone.trim().length === 0) {
    return { success: false, error: 'Phone number is required' };
  }

  // Sanitize phone number to E.164 format
  const sanitizedPhone = sanitizePhoneToE164(phone);

  if (!isValidE164(sanitizedPhone)) {
    return { success: false, error: `Invalid phone number format: ${phone}` };
  }

  // Initialize Supabase Client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let supabase;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    return { success: false, error: 'Database configuration error' };
  }

  // Fetch Settings for Dynamic Keys
  const { data: settings } = await supabase.from('settings').select('*').single();

  // STRICT RULE: Only use User Settings. Do not use system ENV vars.
  const apiKey = settings?.vapi_private_key;
  const assistantId = settings?.vapi_assistant_id;
  const phoneNumberId = settings?.vapi_phone_number_id;

  if (!apiKey || !assistantId || !phoneNumberId) {
    return { success: false, error: 'Please configure your Vapi Keys in the Settings tab to start calling.' };
  }

  // Update Supabase Status (Upsert Lead)
  const { error: dbError } = await supabase
    .from('leads')
    .upsert(
      { 
        phone: sanitizedPhone, 
        name: name.trim(), 
        status: 'Calling', 
        interest: interest.trim(),
        last_contacted: new Date().toISOString()
      },
      { onConflict: 'phone' }
    )
    .select();

  if (dbError) {
    console.error('Supabase Upsert Error:', dbError);
  }

  try {
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId,
        phoneNumberId,
        customer: {
          number: sanitizedPhone,
          name: name.trim(),
        },
        assistantOverrides: {
          variableValues: {
            interest: interest.trim() || 'general dental services',
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `API error: ${response.status}`;
      
      // Rollback Supabase Status on Failure
      if (supabase) {
        console.warn(`Rollback: Setting status to Failed for ${sanitizedPhone} due to API Error.`);
        await supabase
          .from('leads')
          .update({ 
            status: 'Failed', 
            notes: `System: Call failed to start. Error: ${errorMessage}` 
          })
          .eq('phone', sanitizedPhone);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        id: data.id,
        status: data.status,
        customer: {
          number: sanitizedPhone,
          name: name.trim(),
        },
      },
    };
  } catch (error) {
    console.error('Vapi API call failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate call';

    // Rollback Supabase Status on Exception
    if (supabase) {
      console.warn(`Rollback: Setting status to Failed for ${sanitizedPhone} due to Exception.`);
      await supabase
        .from('leads')
        .update({ 
          status: 'Failed', 
          notes: `System: Call exception. Error: ${errorMessage}` 
        })
        .eq('phone', sanitizedPhone);
    }

    return {
      success: false,
      error: errorMessage,
    };

  }
}
