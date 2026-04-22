import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: tournament, error: tournamentError }, { data: leaderboard, error: leaderboardError }, { data: myEntry, error: entryError }] = await Promise.all([
    admin.from('live_tournaments').select('*').eq('id', id).maybeSingle(),
    admin
      .from('live_tournament_entries')
      .select('id, user_id, score, wins, losses, round_reached, profiles!inner(username, favorite_team)')
      .eq('tournament_id', id)
      .order('score', { ascending: false })
      .limit(16),
    admin.from('live_tournament_entries').select('*').eq('tournament_id', id).eq('user_id', user.id).maybeSingle(),
  ]);

  if (tournamentError || leaderboardError || entryError) {
    return NextResponse.json({ error: tournamentError?.message || leaderboardError?.message || entryError?.message }, { status: 500 });
  }

  if (!tournament) {
    return NextResponse.json({ error: 'Turnuva bulunamadı.' }, { status: 404 });
  }

  return NextResponse.json({ data: { tournament, leaderboard, myEntry } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { score, round_reached, completed } = await request.json();
  const safeScore = typeof score === 'number' ? Math.max(0, Math.round(score)) : 0;
  const safeRound = typeof round_reached === 'number' ? Math.max(1, Math.round(round_reached)) : 1;
  const isCompleted = typeof completed === 'boolean' ? completed : false;

  const admin = createAdminClient();
  const { data: entry, error: entryError } = await admin
    .from('live_tournament_entries')
    .select('*')
    .eq('tournament_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (entryError) {
    return NextResponse.json({ error: entryError.message }, { status: 500 });
  }

  if (!entry) {
    return NextResponse.json({ error: 'Turnuva kaydı bulunamadı.' }, { status: 404 });
  }

  const wins = isCompleted ? Math.max(Number(entry.wins ?? 0), safeRound) : Number(entry.wins ?? 0);
  const losses = Number(entry.losses ?? 0);

  const { data, error } = await admin
    .from('live_tournament_entries')
    .update({
      score: safeScore,
      wins,
      losses,
      round_reached: safeRound,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entry.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
