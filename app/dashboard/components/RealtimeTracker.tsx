'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RealtimeTracker() {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel('realtime-leads')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          console.log('Change received!', payload);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
