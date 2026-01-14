'use server';

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Initialize Google Auth from environment variable (works on Vercel)
// Falls back to file for local development
function getGoogleAuth() {
  const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  
  console.log('🔐 Google Auth: ENV var exists?', !!jsonString);
  
  if (jsonString) {
    // Parse the JSON from environment variable
    try {
      // Handle potential escaped newlines in the private key
      const cleanedJson = jsonString.replace(/\\n/g, '\n');
      const credentials = JSON.parse(cleanedJson);
      console.log('🔐 Google Auth: Parsed credentials for', credentials.client_email);
      return new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
      });
    } catch (e: any) {
      console.error('❌ Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e?.message);
      // Try parsing without the newline replacement
      try {
        const credentials = JSON.parse(jsonString);
        console.log('🔐 Google Auth: Parsed credentials (2nd attempt) for', credentials.client_email);
        return new google.auth.GoogleAuth({
          credentials,
          scopes: SCOPES,
        });
      } catch (e2: any) {
        console.error('❌ Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON (2nd attempt):', e2?.message);
        throw new Error('Invalid service account configuration');
      }
    }
  } else {
    // Fallback to file for local development (if env var not set)
    console.log('🔐 Google Auth: Using local file');
    const path = require('path');
    return new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'service_account.json'),
      scopes: SCOPES,
    });
  }
}

const auth = getGoogleAuth();
const calendar = google.calendar({ version: 'v3', auth });

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserCalendarEmail() {
  const { data: settings, error } = await supabase.from('settings').select('calendar_email').eq('id', true).single();
  if (error) {
    console.error('❌ Error fetching calendar_email:', error.message);
    return null;
  }
  console.log('📅 Calendar email from settings:', settings?.calendar_email || 'NOT SET');
  return settings?.calendar_email;
}

interface AppointmentDetails {
  name: string;
  phone: string;
  datetime: string; // ISO string
  oldDatetime?: string;
  eventId?: string;
}

export async function manageAppointment(
  action: 'create' | 'update',
  details: AppointmentDetails
): Promise<string | null> {
  try {
    const calendarEmail = await getUserCalendarEmail();
    if (!calendarEmail) {
      console.error('❌ Configuration Error: Missing calendar_email in settings.');
      return null;
    }

    const { name, phone, datetime } = details;
    
    // Calculate end time (1 hour duration)
    const startDate = new Date(datetime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const eventResource = {
      summary: `Appt: ${name} (${phone})`,
      description: `Phone: ${phone}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC', // Or adjustable if needed
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC',
      },
    };

    if (action === 'create') {
      const response = await calendar.events.insert({
        calendarId: calendarEmail,
        requestBody: eventResource,
      });

      // console.log('✅ Calendar Event Created:', response.data.htmlLink);
      return response.data.htmlLink || null;
    }

    if (action === 'update') {
      let eventIdToUpdate = details.eventId;

      // If no ID provided, search for existing event by phone
      if (!eventIdToUpdate) {
        // Search for upcoming events containing the phone number
        const listResponse = await calendar.events.list({
          calendarId: calendarEmail,
          q: phone, // Free text search for the phone number
          timeMin: new Date().toISOString(), // Filter for future events
          singleEvents: true,
          orderBy: 'startTime',
        });

        const events = listResponse.data.items;
        if (events && events.length > 0) {
          // Verify description matches exactly to avoid false positives with partial numbers
          // (Though q search is usually good enough for this context)
          const match = events.find(e => e.description && e.description.includes(phone));
          if (match) {
            eventIdToUpdate = match.id || undefined;
          }
        }
      }

      if (eventIdToUpdate) {
        // Update existing event
        const response = await calendar.events.patch({
          calendarId: calendarEmail,
          eventId: eventIdToUpdate,
          requestBody: {
            start: eventResource.start,
            end: eventResource.end,
            summary: eventResource.summary, // Update summary in case name changed
            description: eventResource.description
          },
        });
        // console.log('✅ Calendar Event Updated:', response.data.htmlLink);
        return response.data.htmlLink || null;
      } else {
        // Fallback: Create new if not found
        // console.log('⚠️ No existing event found to update. Creating new event.');
        const response = await calendar.events.insert({
          calendarId: calendarEmail,
          requestBody: eventResource,
        });
        return response.data.htmlLink || null;
      }
    }

    return null;

  } catch (error) {
    console.error('❌ Google Calendar Error:', error);
    // Depending on requirements, we might want to rethrow or return null
    // Here we return null so the flow doesn't crash, but logs the error
    return null;
  }
}

export async function checkAvailability(date: string) {
  console.log("📅 checkAvailability called with date:", date);
  
  try {
    const calendarEmail = await getUserCalendarEmail();
    if (!calendarEmail) {
      console.error('❌ No calendar email configured');
      return "Configuration Error: Please configure your Calendar Email in Settings.";
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`📅 Checking calendar: ${calendarEmail} from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // console.log(`Checking Time Range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const events = await calendar.events.list({
      calendarId: calendarEmail, 
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: 'America/New_York',
    });

    console.log(`📅 Events found: ${events.data.items?.length || 0}`);

    const busySlots = events.data.items?.map(event => {
        const start = event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', timeZone: 'America/New_York'}) : 'All Day';
        return start;
    }).join(', ');

    const result = busySlots && busySlots.length > 0 
      ? `Busy times on that day: ${busySlots}.` 
      : "The calendar is free. You can book.";
    
    console.log('📅 Availability result:', result);
    return result;
      
  } catch (error: any) {
    console.error("❌ Calendar Check Error:", error?.message || error);
    console.error("❌ Full error:", JSON.stringify(error, null, 2));
    return "Could not check calendar. There was a technical error.";
  }
}
