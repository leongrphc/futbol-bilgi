import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('live_tournaments')
    .select('*')
    .order('starts_at', { ascending: true })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tournamentId } = await request.json();
  if (typeof tournamentId !== 'string') {
    return NextResponse.json({ error: 'Tournament id gerekli.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: tournament, error: tournamentError } = await admin
    .from('live_tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (tournamentError) {
    return NextResponse.json({ error: tournamentError.message }, { status: 500 });
  }

  const { data: existingEntry } = await admin
    .from('live_tournament_entries')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingEntry) {
    return NextResponse.json({ data: existingEntry });
  }

  const { data: entry, error: entryError } = await admin
    .from('live_tournament_entries')
    .insert({ tournament_id: tournamentId, user_id: user.id })
    .select('*')
    .single();

  if (entryError) {
    return NextResponse.json({ error: entryError.message }, { status: 500 });
  }

  await admin
    .from('live_tournaments')
    .update({ current_players: Number(tournament.current_players ?? 0) + 1, updated_at: new Date().toISOString() })
    .eq('id', tournamentId);

  return NextResponse.json({ data: entry });
}
