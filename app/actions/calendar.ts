'use server';

import { google } from 'googleapis';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Initialize Google Auth
// Assumes service_account.json is in the project root
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'service_account.json'),
  scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getUserCalendarEmail() {
  const { data: settings } = await supabase.from('settings').select('calendar_email').single();
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
  // console.log("📅 DEBUG: Checking availability for:", date);
  
  try {
    const calendarEmail = await getUserCalendarEmail();
    if (!calendarEmail) {
      return "Configuration Error: Please configure your Calendar Email in Settings.";
    }

    // START: Auth Logic - Using global 'calendar' instance initialized at top of file
    // This matches the authentication method used by manageAppointment
    
    // END: Auth Logic

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // console.log(`Checking Time Range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const events = await calendar.events.list({
      calendarId: calendarEmail, 
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: 'America/New_York',
    });

    // console.log(`📅 Events found: ${events.data.items?.length || 0}`);

    const busySlots = events.data.items?.map(event => {
        const start = event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', timeZone: 'America/New_York'}) : 'All Day';
        return start;
    }).join(', ');

    return busySlots && busySlots.length > 0 
      ? `Busy times on that day: ${busySlots}.` 
      : "The calendar is free. You can book.";
      
  } catch (error) {
    console.error("Calendar Check Error:", error);
    return "Could not check calendar.";
  }
}
