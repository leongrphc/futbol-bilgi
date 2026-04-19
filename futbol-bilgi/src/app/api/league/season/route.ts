import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: season, error } = await supabase
      .rpc('get_current_season')
      .single();

    if (error) throw error;

    return NextResponse.json({ data: season });
  } catch (error) {
    console.error('Error fetching current season:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current season' },
      { status: 500 }
    );
  }
}
