import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { manageAppointment, checkAvailability } from '@/app/actions/calendar';

// Initialize Supabase - Use Service Role Key to bypass RLS for webhook operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // CHANGED from ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  // console.log("🔔 WEBHOOK RECEIVED:", new Date().toISOString());
  try {
    const body = await req.json();
    // console.log("📦 Payload Type:", body.message?.type);
    const message = body.message;

    // 1. Log the incoming message for debugging
    // console.log("--- Vapi Webhook ---");
    // console.log("Type:", message.type);

    if (!message) {
      return NextResponse.json({ message: "No message found" }, { status: 200 });
    }

    // Robust extraction of phone number
    const incomingPhone = message.customer?.number || message.call?.customer?.number;
    
    // Extract UserID
    const userId = message.call?.assistantOverrides?.variableValues?.userId || message.assistantOverrides?.variableValues?.userId;

    if (!incomingPhone) {
      return NextResponse.json({ message: "No customer phone number found" }, { status: 200 });
    }
    
    if (!userId && message.type === 'tool-calls') {
      console.warn("⚠️ UserID missing in webhook payload. Calendar operations may fail.");
    }

    // console.log("Incoming Phone:", incomingPhone);

    // ---------------------------------------------------------
    // SCENARIO A: BOOKING CONFIRMED (Tool Call)
    // ---------------------------------------------------------
    if (message.type === 'tool-calls') {
      const toolCall = message.toolCalls[0];
      const customerName = message.customer?.name || message.call?.customer?.name || 'Unknown Customer';
      
      // Safe Argument Parsing
      let args = toolCall.function.arguments;
      if (typeof args === 'string') {
        try {
          args = JSON.parse(args);
        } catch (e) {
          console.error("Error parsing JSON args:", e);
          args = {}; 
        }
      }

      // console.log("🛠️ Tool Triggered:", toolCall.function.name);
      // console.log("arguments:", args);
      
      switch (toolCall.function.name) {
        case 'bookAppointment': {
          // console.log("Booking Args:", args);
          const notes = `Appointment: ${args.datetime || 'Unspecified'}. Notes: ${args.notes || 'None'}`;
          
          // 1. UPDATE DB
          await updateLeadStatus(incomingPhone, 'Booked', notes, userId);

          // 2. GOOGLE CALENDAR
          if (args.datetime && userId) {
            await manageAppointment('create', {
              name: customerName,
              phone: incomingPhone,
              datetime: args.datetime
            }, userId);
          } else if (!userId) {
             return NextResponse.json({ results: [{ toolCallId: toolCall.id, result: "Error: User context missing." }] });
          }
          
          return NextResponse.json({ 
            results: [{
              toolCallId: toolCall.id,
              result: "Appointment confirmed and added to calendar."
            }]
          });
        }

        case 'rescheduleAppointment': {
          // console.log("Rescheduling Args:", args);
          const notes = `Rescheduled to: ${args.datetime || 'Unspecified'}.`;

          // 1. UPDATE DB
          await updateLeadStatus(incomingPhone, 'Booked', notes, userId);

          // 2. GOOGLE CALENDAR
          if (args.datetime && userId) {
            await manageAppointment('update', {
              name: customerName,
              phone: incomingPhone,
              datetime: args.datetime
            }, userId);
          }

          return NextResponse.json({ 
            results: [{
              toolCallId: toolCall.id,
              result: "Appointment successfully rescheduled."
            }]
          });
        }

        case 'checkAvailability': {
          if (!args.date) {
            console.warn("⚠️ checkAvailability called without date");
            return NextResponse.json({
              results: [{
                toolCallId: toolCall.id,
                result: "Error: Date parameter missing. You must ask the user for a specific date before checking availability."
              }]
            });
          }
          
          if (!userId) {
             return NextResponse.json({ results: [{ toolCallId: toolCall.id, result: "Configuration Error: User identification missing." }] });
          }

          const availability = await checkAvailability(args.date, userId);
          return NextResponse.json({
            results: [{
              toolCallId: toolCall.id,
              result: availability
            }]
          });
        }
      }
    }

    // ---------------------------------------------------------
    // SCENARIO B: CALL ENDED
    // ---------------------------------------------------------
    if (message.type === 'end-of-call-report') {
      // console.log("Call Ended. Reason:", message.endedReason);
      
      // Only update if it wasn't already booked
      const { data: currentLead } = await supabase
        .from('leads')
        .select('status')
        .eq('phone', incomingPhone) 
        .single();

      // If we found the lead and they are already booked, don't overwrite it
      if (currentLead && currentLead.status === 'Booked') {
        // console.log("Lead already booked. Skipping status overwrite.");
      } else {
        // Determine status based on endedReason
        let newStatus = 'Pending';
        
        const failedReasons = ['voicemail', 'customer-did-not-answer', 'call-forwarding-detected'];
        
        if (failedReasons.includes(message.endedReason)) {
          newStatus = 'Voicemail';
        } else if (message.endedReason === 'completed') {
           // Call completed but not booked (otherwise we would have hit Tool Call logic or Booked status check)
           newStatus = 'Pending';
        }

        const summary = message.analysis ? message.analysis.summary : "No summary";
        await updateLeadStatus(incomingPhone, newStatus, `Call Ended (${message.endedReason}). Summary: ${summary}`);
      }
    }

    return NextResponse.json({ message: "Received" }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------
// HELPER: ROBUST PHONE MATCHING
// ---------------------------------------------------------
async function updateLeadStatus(incomingPhone: string, status: string, notes: string, userId?: string) {
  // 1. Clean the number (remove +)
  const cleanPhone = incomingPhone.replace('+', ''); // "1321..."
  const last10 = cleanPhone.slice(-10); // "321..."

  // console.log(`Attempting update for ${incomingPhone} | Clean: ${cleanPhone} | Last10: ${last10} -> Status: ${status}`);

  // Helper used to apply user filter if available
  const applyUserFilter = (query: any) => {
    if (userId) return query.eq('user_id', userId);
    return query;
  }

  // TRY 1: Exact Match (+1321...)
  let { data, error } = await applyUserFilter(supabase
    .from('leads')
    .update({ status: status, notes: notes })
    .eq('phone', incomingPhone))
    .select();

  // TRY 2: Clean Match (1321...)
  if (!data || data.length === 0) {
    // console.log("Exact match failed. Trying clean match (no plus)...");
    ({ data, error } = await applyUserFilter(supabase
      .from('leads')
      .update({ status: status, notes: notes })
      .eq('phone', cleanPhone))
      .select());
  }

  // TRY 3: Last 10 Digits (Common US Format mismatch solver)
  if (!data || data.length === 0) {
    // console.log(`Clean match failed. Trying last 10 digits: ${last10}...`);
    // Note: This logic assumes most leads in DB allow unique identification by last 10 digits
    // We first find the lead ID to ensure we don't accidentally update multiple if data is messy
    let query = supabase
      .from('leads')
      .select('id, phone')
      .or(`phone.eq.${last10},phone.ilike.%${last10}`) // Try exact match of 10 digits OR partial match
      .limit(1);
      
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data: searchData } = await query;

    if (searchData && searchData.length > 0) {
       const targetId = searchData[0].id;
       // console.log(`Found lead by fuzzy match: ${searchData[0].phone} (ID: ${targetId})`);
       ({ data, error } = await supabase
         .from('leads')
         .update({ status: status, notes: notes })
         .eq('id', targetId)
         .select());
    }
  }
         .eq('id', targetId)
         .select());
    }
  }

  if (error) {
    console.error("Supabase Error:", error);
  } else if (data && data.length > 0) {
    // console.log("✅ SUCCESS: Row updated!", data[0]);
  } else {
    console.error("❌ FAILED: Could not find row in DB for ANY format.");
  }
}