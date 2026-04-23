import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/supabase/request-auth';
import { TOURNAMENT_CONFIG } from '@/lib/constants/game';
import { getTournamentQuestionSetForEntry } from '@/lib/questions/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const round = Number(searchParams.get('round') || 1);
  const safeRound = Number.isFinite(round) ? Math.max(1, Math.min(TOURNAMENT_CONFIG.total_rounds, Math.round(round))) : 1;

  const admin = createAdminClient();
  const [{ data: tournament, error: tournamentError }, { data: entry, error: entryError }] = await Promise.all([
    admin.from('live_tournaments').select('id, league_scope').eq('id', id).maybeSingle(),
    admin.from('live_tournament_entries').select('id').eq('tournament_id', id).eq('user_id', user.id).maybeSingle(),
  ]);

  if (tournamentError || entryError) {
    return NextResponse.json({ error: tournamentError?.message || entryError?.message }, { status: 500 });
  }

  if (!tournament) {
    return NextResponse.json({ error: 'Turnuva bulunamadı.' }, { status: 404 });
  }

  if (!entry) {
    return NextResponse.json({ error: 'Turnuva kaydı bulunamadı.' }, { status: 404 });
  }

  try {
    const questions = await getTournamentQuestionSetForEntry(entry.id, tournament.league_scope, safeRound, TOURNAMENT_CONFIG.questions_per_round);
    return NextResponse.json({ data: { questions } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Turnuva soruları alınamadı.' }, { status: 500 });
  }
}
