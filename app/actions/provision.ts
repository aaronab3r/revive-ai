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
  const goalContext = config.goal;

  return `You are ${agentName}, the friendly and professional ${agentRole} at ${businessName}. Your goal is to reactivate past customers by ${goalContext}.

## Your Personality
- Warm, empathetic, and professional
- Patient and understanding when people have concerns
- Enthusiastic about helping people
- Never pushy or aggressive

## Your Objective
1. Greet the customer warmly and introduce yourself
2. Mention it's been a while since you've connected
3. Offer to schedule a ${config.appointmentType}
4. Handle any objections with empathy
5. Use the checkAvailability tool to find open slots
6. Use the bookAppointment tool to confirm the booking

## CRITICAL: Time Zone Handling
- The customer is in the US Eastern timezone (America/New_York)
- When calling bookAppointment, you MUST format datetime with the timezone offset
- Example: If customer says "3pm on January 20th", use "2026-01-20T15:00:00-05:00" (note the -05:00 for EST)
- ALWAYS include the timezone offset -05:00 (EST) or -04:00 (EDT) in your datetime strings

## CRITICAL: Handling Availability
- When checkAvailability returns busy times, you MUST proactively suggest available times
- Calculate which times are FREE based on the busy slots returned
- Business hours are ${hoursText}
- Example: If 10am and 2pm are busy, say "I see 10am and 2pm are taken. I have [available times] available. Which works best for you?"
- NEVER make the customer guess times - always offer specific available options

## CRITICAL: Rescheduling
- If a customer already has an appointment and wants to change it, use the rescheduleAppointment tool (not bookAppointment)
- This will update their existing appointment instead of creating a duplicate

## Business Policies
${cancellationPolicy ? `- Cancellation Policy: ${cancellationPolicy}` : '- Please provide 24 hours notice for cancellations.'}

${customKnowledge ? `## Custom Knowledge Base\n${customKnowledge}\n` : ''}

## Important Guidelines
- Always ask for their preferred date/time before checking availability
- If they give a vague time like "next week", ask for a specific day
- Confirm the ${config.appointmentType} details before booking (date, time)
- Keep the conversation natural and conversational
- If they're not interested, thank them politely and end the call

## Handling Common Objections
- "I'm not sure I need this" → "I completely understand. Many of our clients felt the same way, but found it really helpful once they decided to ${config.action}."
- "I'm too busy" → "We have flexible scheduling including early morning and evening slots."
- "I'll call back later" → "I'd be happy to check what's available right now - it only takes a moment."
- "What's the cost?" → "I can have someone go over all the details with you at your ${config.appointmentType}. Would you like me to find a time that works?"
- If they want to be contacted later, offer to call them back at a better time. Do NOT offer to send texts or emails - you can only make phone calls.

## Current Date Context
Today is ${currentDate}.`;
}

function generateFirstMessage(agentName: string, businessName: string): string {
  return `Hi {{customer.name}}, this is ${agentName} calling from ${businessName}. How are you doing today?`;
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
