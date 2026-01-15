'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/supabase/server';

const VAPI_BASE_URL = 'https://api.vapi.ai';
const WEBHOOK_URL = 'https://revive-ai-three.vercel.app/api/vapi/webhook';

// Dynamic System Prompt Generator
function generateSystemPrompt(
  agentName: string, 
  agentRole: string, 
  businessName: string, 
  industry: string,
  businessHours?: { start: string, end: string },
  cancellationPolicy?: string,
  customKnowledge?: string
): string {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hoursText = businessHours ? `${businessHours.start} to ${businessHours.end}` : '9am to 5pm';
  
  // Industry-specific terminology (fully dynamic - no generic "consultation" unless appropriate)
  const industryConfig: Record<string, { goal: string; appointmentType: string; action: string }> = {
    'Dental': { goal: 'scheduling them for a cleaning or checkup', appointmentType: 'appointment', action: 'come in' },
    'Medical': { goal: 'scheduling them for a follow-up visit', appointmentType: 'appointment', action: 'come in' },
    'Home Services': { goal: 'scheduling a service visit', appointmentType: 'service appointment', action: 'have our team visit' },
    'Real Estate': { goal: 'scheduling a property viewing', appointmentType: 'viewing', action: 'see the property' },
    'Legal': { goal: 'scheduling a meeting with an attorney', appointmentType: 'meeting', action: 'meet with us' },
    'Fitness': { goal: 'scheduling a fitness session or class', appointmentType: 'session', action: 'come in' },
    'Salon/Spa': { goal: 'booking their next treatment', appointmentType: 'appointment', action: 'come in' },
    'General': { goal: 'scheduling an appointment', appointmentType: 'appointment', action: 'meet with us' },
  };

  const config = industryConfig[industry] || industryConfig['General'];

  return `You are ${agentName}, a real human ${agentRole} at ${businessName}. You're making a friendly call to reconnect with a past customer.

## CRITICAL: Be Human, Not Robotic
- Speak like a real person having a natural phone conversation
- NEVER repeat yourself or re-introduce yourself after greeting
- When someone says "I'm good, how are you?" - just respond naturally like "I'm doing great, thanks for asking!" then smoothly transition to why you're calling
- Use natural filler words occasionally: "So...", "Well...", "Actually...", "You know..."
- Vary your phrasing - don't use the same words repeatedly
- Listen and respond to what they actually say, don't just follow a script

## The Customer's Reason for This Call
Their interest: {{interest}}
- Naturally incorporate this into conversation - DON'T read it word-for-word
- Examples of natural incorporation:
  - If interest is "Root canal checkup" → say "following up on your root canal" or "checking in about that root canal"
  - If interest is "AC repair" → say "wanted to see how your AC is holding up" or "following up about your air conditioning"
  - If interest is "teeth whitening" → say "wanted to chat about the whitening treatment you were interested in"
- Make it sound like YOU remember them, not like you're reading from a screen

## Conversation Flow
1. Greet naturally (your first message handles this)
2. If they respond with pleasantries ("good, how are you?"), respond briefly then transition: "I'm great, thanks! So the reason I'm calling..."
3. Mention their specific interest naturally (see examples above)
4. Gauge their interest before jumping to scheduling
5. If they're interested, ask about their availability
6. Use tools to check and book

## Your Personality
- Warm and genuine, like talking to a friendly neighbor
- Confident but not pushy
- Empathetic - actually listen to their concerns
- Brief and respectful of their time

## Scheduling (only when they're interested)
- Ask: "When works best for you?" or "Do you have a day in mind?"
- Use checkAvailability to verify the date
- Business hours: ${hoursText}
- Use bookAppointment to confirm (include timezone: -05:00 for EST)

## Tool Usage
- checkAvailability: Check what times are open on a specific date
- bookAppointment: Book a NEW appointment (use datetime like "2026-01-20T15:00:00-05:00")
- rescheduleAppointment: Change an EXISTING appointment to a new time

## If They're Not Interested
- Don't push - say something like "No problem at all! Just wanted to reach out. Take care!"
- End the call gracefully

## Common Responses
- "I'm busy right now" → "Totally understand! Is there a better time I could give you a quick call back?"
- "How much does it cost?" → "Great question - I can have someone go over everything when you come in. Want me to find a time?"
- "Let me think about it" → "Of course, take your time. Would it help if I checked what times are available this week?"

Today is ${currentDate}.`;
}

function generateFirstMessage(agentName: string, businessName: string): string {
  return `Hey {{customer.name}}! This is ${agentName} from ${businessName}. How's it going?`;
}

// Tool definitions for the assistant
const TOOLS = [
  {
    type: "function",
    function: {
      name: "checkAvailability",
      description: "Check the calendar availability for a specific date. Use this before booking to see what times are open.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "The date to check availability for, in YYYY-MM-DD format (e.g., 2026-01-20)"
          }
        },
        required: ["date"]
      }
    },
    server: {
      url: WEBHOOK_URL
    }
  },
  {
    type: "function",
    function: {
      name: "bookAppointment",
      description: "Book a NEW appointment for the customer. Only use this after confirming the date and time with them. Include timezone offset in datetime.",
      parameters: {
        type: "object",
        properties: {
          datetime: {
            type: "string",
            description: "The full date and time with timezone offset in ISO 8601 format. MUST include timezone offset. Example: 2026-01-20T15:00:00-05:00 for 3pm Eastern"
          },
          notes: {
            type: "string",
            description: "Any additional notes about the appointment"
          }
        },
        required: ["datetime"]
      }
    },
    server: {
      url: WEBHOOK_URL
    }
  },
  {
    type: "function",
    function: {
      name: "rescheduleAppointment",
      description: "Update an EXISTING appointment to a new time. Use this when the customer already has an appointment and wants to change it.",
      parameters: {
        type: "object",
        properties: {
          datetime: {
            type: "string",
            description: "The NEW date and time with timezone offset in ISO 8601 format. Example: 2026-01-20T15:00:00-05:00 for 3pm Eastern"
          }
        },
        required: ["datetime"]
      }
    },
    server: {
      url: WEBHOOK_URL
    }
  }
];

interface ProvisionResult {
  success: boolean;
  message: string;
  data?: {
    assistantId: string;
    phoneNumberId: string;
  };
}

interface ProvisionParams {
  vapiPrivateKey: string;
  businessName: string;
  businessIndustry: string;
  agentName: string;
  agentRole: string;
}

export async function provisionSystem(params: ProvisionParams): Promise<ProvisionResult> {
  const { vapiPrivateKey, businessName, businessIndustry, agentName, agentRole } = params;

  // Get current user
  const user = await getUser();
  if (!user) {
    return { success: false, message: 'Not authenticated. Please sign in.' };
  }

  if (!vapiPrivateKey || vapiPrivateKey.trim().length === 0) {
    return { success: false, message: 'Vapi Private Key is required.' };
  }

  if (!businessName || businessName.trim().length === 0) {
    return { success: false, message: 'Business Name is required. Please fill in your business details first.' };
  }

  // Use defaults if not provided
  const finalAgentName = agentName?.trim() || 'Sarah';
  const finalAgentRole = agentRole?.trim() || 'Assistant';
  const finalIndustry = businessIndustry?.trim() || 'General';

  // Fetch optional Business Settings from DB
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data: dbSettings } = await supabase
    .from('settings')
    .select('business_hours_start, business_hours_end, cancellation_policy, custom_knowledge')
    .eq('user_id', user.id)
    .single();

  const businessHours = (dbSettings?.business_hours_start && dbSettings?.business_hours_end)
    ? { start: dbSettings.business_hours_start, end: dbSettings.business_hours_end }
    : undefined;

  // Generate dynamic prompts
  const systemPrompt = generateSystemPrompt(
    finalAgentName, 
    finalAgentRole, 
    businessName, 
    finalIndustry,
    businessHours,
    dbSettings?.cancellation_policy,
    dbSettings?.custom_knowledge
  );
  const firstMessage = generateFirstMessage(finalAgentName, businessName);

  const headers = {
    'Authorization': `Bearer ${vapiPrivateKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // =========================================================
    // STEP A: Create the AI Assistant
    // =========================================================
    console.log('🚀 Step A: Creating AI Assistant...');
    
    const assistantPayload = {
      name: businessName.substring(0, 40),
      voice: {
        provider: "11labs",
        voiceId: "cgSgspJ2msm6clMCkdW9", // Rachel voice (professional female)
        model: "eleven_turbo_v2_5"
      },
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          }
        ],
        tools: TOOLS,
        toolIds: []
      },
      firstMessage: firstMessage,
      firstMessageMode: "assistant-waits-for-user",
      serverUrl: WEBHOOK_URL,
      endCallFunctionEnabled: true,
      recordingEnabled: true,
      hipaaEnabled: false,
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 600, // 10 minute max call
    };

    const assistantResponse = await fetch(`${VAPI_BASE_URL}/assistant`, {
      method: 'POST',
      headers,
      body: JSON.stringify(assistantPayload),
    });

    if (!assistantResponse.ok) {
      const errorData = await assistantResponse.json().catch(() => ({}));
      console.error('Assistant creation failed:', errorData);
      return { 
        success: false, 
        message: `Failed to create assistant: ${errorData.message || assistantResponse.statusText}` 
      };
    }

    const assistantData = await assistantResponse.json();
    const assistantId = assistantData.id;
    console.log('✅ Assistant created:', assistantId);

    // =========================================================
    // STEP B: Get Phone Number from their account
    // =========================================================
    console.log('📞 Step B: Fetching phone numbers...');
    
    const phoneResponse = await fetch(`${VAPI_BASE_URL}/phone-number`, {
      method: 'GET',
      headers,
    });

    console.log('📞 Phone API Response Status:', phoneResponse.status);

    if (!phoneResponse.ok) {
      const errorData = await phoneResponse.json().catch(() => ({}));
      console.error('📞 Phone API Error:', errorData);
      return { 
        success: false, 
        message: `Failed to fetch phone numbers: ${errorData.message || phoneResponse.statusText}` 
      };
    }

    const phoneNumbers = await phoneResponse.json();
    console.log('📞 Phone Numbers Response:', JSON.stringify(phoneNumbers, null, 2));
    
    if (!phoneNumbers || (Array.isArray(phoneNumbers) && phoneNumbers.length === 0)) {
      return { 
        success: false, 
        message: 'No phone number found on your Vapi account. Go to vapi.ai → Dashboard → Phone Numbers → Buy a phone number, then try again.' 
      };
    }

    // Handle both array response and potential object response
    const phoneNumberList = Array.isArray(phoneNumbers) ? phoneNumbers : (phoneNumbers.data || phoneNumbers.phoneNumbers || [phoneNumbers]);
    
    if (phoneNumberList.length === 0) {
      return { 
        success: false, 
        message: `No phone number found for this Vapi account. Make sure you're using the Private Key from the same account where you purchased the phone number. Go to vapi.ai → Phone Numbers to verify.` 
      };
    }

    const phoneNumberId = phoneNumberList[0].id;
    console.log('✅ Found phone number:', phoneNumberId);

    // =========================================================
    // STEP C: Link Assistant to Phone Number
    // =========================================================
    console.log('🔗 Step C: Linking assistant to phone number...');
    
    const linkResponse = await fetch(`${VAPI_BASE_URL}/phone-number/${phoneNumberId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        assistantId: assistantId
      }),
    });

    if (!linkResponse.ok) {
      const errorData = await linkResponse.json().catch(() => ({}));
      console.error('Phone linking failed:', errorData);
      return { 
        success: false, 
        message: `Failed to link assistant to phone: ${errorData.message || linkResponse.statusText}` 
      };
    }

    console.log('✅ Assistant linked to phone number');

    // =========================================================
    // STEP D: Save to Database
    // =========================================================
    console.log('💾 Step D: Saving to database...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return { 
        success: false, 
        message: 'Database configuration error. Please contact support.' 
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from('settings')
      .upsert({
        user_id: user.id,
        vapi_private_key: vapiPrivateKey,
        vapi_assistant_id: assistantId,
        vapi_phone_number_id: phoneNumberId,
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('Database save failed:', dbError);
      return { 
        success: false, 
        message: `Configuration created but failed to save: ${dbError.message}` 
      };
    }

    console.log('✅ Settings saved to database');

    // Revalidate the settings page
    revalidatePath('/dashboard/settings');

    return {
      success: true,
      message: `🎉 ${finalAgentName} is ready! Your AI ${finalAgentRole} for ${businessName} has been created and linked to your phone number.`,
      data: {
        assistantId,
        phoneNumberId,
      }
    };

  } catch (error) {
    console.error('Provision error:', error);
    return { 
      success: false, 
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}
