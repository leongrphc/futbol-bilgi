import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('season_id');
    const tier = searchParams.get('tier');

    const supabase = await createClient();

    let query = supabase
      .from('league_season_entries')
      .select('*')
      .order('season_score', { ascending: false });

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    if (tier) {
      query = query.eq('tier_at_start', tier);
    }

    const { data: entries, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data: entries });
  } catch (error) {
    console.error('Error fetching league entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, tier } = body;

    if (!user_id || !tier) {
      return NextResponse.json(
        { error: 'user_id and tier are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current season
    const { data: season, error: seasonError } = await supabase
      .rpc('get_current_season')
      .single();

    if (seasonError) throw seasonError;
    if (!season || typeof season !== 'object' || !('id' in season)) {
      throw new Error('Active season not found');
    }

    const seasonId = season.id as string;

    // Check if entry exists
    const { data: existing } = await supabase
      .from('league_season_entries')
      .select('id')
      .eq('user_id', user_id)
      .eq('season_id', seasonId)
      .single();

    if (existing) {
      return NextResponse.json({ data: existing });
    }

    // Create new entry
    const { data: entry, error } = await supabase
      .from('league_season_entries')
      .insert({
        user_id,
        season_id: season.id,
        tier_at_start: tier,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: entry });
  } catch (error) {
    console.error('Error creating league entry:', error);
    return NextResponse.json(
      { error: 'Failed to create league entry' },
      { status: 500 }
    );
  }
}
