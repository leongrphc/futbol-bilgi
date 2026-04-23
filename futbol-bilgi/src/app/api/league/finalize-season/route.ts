import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/supabase/request-auth';
import type { LeagueTier } from '@/types';

const VALID_TIERS: LeagueTier[] = ['bronze', 'silver', 'gold', 'diamond', 'champion'];

export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { season_id, tier } = await request.json();

  if (!season_id || !tier || !VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: 'season_id and valid tier are required' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const { error: finalizeError } = await admin.rpc('finalize_league_season_for_tier', {
      p_season_id: season_id,
      p_tier: tier,
    });

    if (finalizeError) {
      throw finalizeError;
    }

    const [{ data: entries, error: entriesError }, { data: profile, error: profileError }] = await Promise.all([
      admin
        .from('league_season_entries')
        .select('*')
        .eq('season_id', season_id)
        .order('season_score', { ascending: false }),
      admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
    ]);

    if (entriesError) {
      throw entriesError;
    }

    if (profileError) {
      throw profileError;
    }

    return NextResponse.json({ data: { entries, profile } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to finalize season';
    console.error('Error finalizing league season:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
