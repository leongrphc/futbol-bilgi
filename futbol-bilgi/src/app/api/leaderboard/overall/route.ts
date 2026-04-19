import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Number(limitParam), 200) : 100;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, avatar_frame, league_tier, xp')
      .order('xp', { ascending: false })
      .limit(Number.isFinite(limit) ? limit : 100);

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching overall leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overall leaderboard' },
      { status: 500 }
    );
  }
}
