import { NextResponse } from 'next/server';
import { checkAvailability, manageAppointment } from '@/app/actions/calendar';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'check';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  console.log('🧪 Test Calendar API called:', { action, date });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unauthorized. Please log in to test the calendar.' 
    }, { status: 401 });
  }

  try {
    if (action === 'check') {
      const result = await checkAvailability(date, user.id);
      return NextResponse.json({ 
        success: true, 
        action: 'checkAvailability',
        date,
        result 
      });
    }

    if (action === 'book') {
      const result = await manageAppointment('create', {
        name: 'Test Booking',
        phone: '+15551234567',
        datetime: `${date}T14:00:00`,
      }, user.id);
      return NextResponse.json({ 
        success: !!result, 
        action: 'bookAppointment',
        date,
        result: result || 'Failed to book' 
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use ?action=check or ?action=book' });
  } catch (error: any) {
    console.error('🧪 Test Calendar Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Unknown error',
      stack: error?.stack
    }, { status: 500 });
  }
}
