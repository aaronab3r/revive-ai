'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const VAPI_BASE_URL = 'https://api.vapi.ai';
const WEBHOOK_URL = 'https://revive-ai.vercel.app/api/vapi/webhook';

// Dynamic System Prompt Generator
function generateSystemPrompt(agentName: string, agentRole: string, businessName: string, industry: string): string {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Industry-specific context
  const industryContext: Record<string, string> = {
    'Dental': 'scheduling them for a cleaning or checkup appointment',
    'Medical': 'scheduling them for a consultation or follow-up appointment',
    'Home Services': 'scheduling a service call or consultation',
    'Real Estate': 'scheduling a property viewing or consultation call',
    'Legal': 'scheduling a consultation with an attorney',
    'Fitness': 'scheduling a fitness assessment or class',
    'Salon/Spa': 'booking their next appointment',
    'General': 'scheduling an appointment or consultation',
  };

  const goalContext = industryContext[industry] || industryContext['General'];

  return `You are ${agentName}, the friendly and professional ${agentRole} at ${businessName}. Your goal is to reactivate past customers by ${goalContext}.

## Your Personality
- Warm, empathetic, and professional
- Patient and understanding when people have concerns
- Enthusiastic about helping people
- Never pushy or aggressive

## Your Objective
1. Greet the customer warmly and introduce yourself
2. Mention it's been a while since you've connected
3. Offer to schedule an appointment or service
4. Handle any objections with empathy
5. Use the checkAvailability tool to find open slots
6. Use the bookAppointment tool to confirm the booking

## Important Guidelines
- Always ask for their preferred date/time before checking availability
- If they give a vague time like "next week", ask for a specific day
- Confirm the appointment details before booking
- Keep the conversation natural and conversational
- If they're not interested, thank them politely and end the call

## Handling Common Objections
- "I'm not sure I need this" → "I completely understand. Many of our clients felt the same way, but found it really helpful once they came in."
- "I'm too busy" → "We have flexible scheduling including early morning and evening slots."
- "I'll call back later" → "I'd be happy to check what's available right now - it only takes a moment."
- "What's the cost?" → "I can have someone go over all the details with you at your appointment. Would you like me to find a time that works?"
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
      description: "Book an appointment for the patient. Only use this after confirming the date and time with the patient.",
      parameters: {
        type: "object",
        properties: {
          datetime: {
            type: "string",
            description: "The full date and time for the appointment in ISO 8601 format (e.g., 2026-01-20T10:00:00)"
          },
          notes: {
            type: "string",
            description: "Any additional notes about the appointment (e.g., 'cleaning and checkup', 'first visit in 2 years')"
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

  // Generate dynamic prompts
  const systemPrompt = generateSystemPrompt(finalAgentName, finalAgentRole, businessName, finalIndustry);
  const firstMessage = generateFirstMessage(finalAgentName, businessName);

  // Log partial key for debugging (first 8 chars only)
  const keyPreview = vapiPrivateKey.substring(0, 8) + '...';
  console.log('🔑 Using Vapi Key starting with:', keyPreview);

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
        message: `No phone number found for this Vapi account (key: ${keyPreview}). Make sure you're using the Private Key from the same account where you purchased the phone number. Go to vapi.ai → Phone Numbers to verify.` 
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
        id: true,
        vapi_private_key: vapiPrivateKey,
        vapi_assistant_id: assistantId,
        vapi_phone_number_id: phoneNumberId,
      });

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
