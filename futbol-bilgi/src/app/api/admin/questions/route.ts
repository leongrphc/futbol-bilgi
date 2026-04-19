import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const supabase = createAdminClient();

  if (id) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  }

  const search = searchParams.get('search') || '';
  const leagueScope = searchParams.get('league_scope');
  const league = searchParams.get('league');
  const difficulty = searchParams.get('difficulty');
  const isActive = searchParams.get('is_active');
  const sort = searchParams.get('sort') || 'updated_at';
  const limit = Number(searchParams.get('limit') || 50);

  let query = supabase.from('questions').select('*').limit(limit);

  if (search) {
    query = query.ilike('question_text', `%${search}%`);
  }

  if (leagueScope) {
    query = query.eq('league_scope', leagueScope);
  }

  if (league) {
    query = query.eq('league', league);
  }

  if (difficulty) {
    query = query.eq('difficulty', Number(difficulty));
  }

  if (isActive !== null && isActive !== undefined) {
    query = query.eq('is_active', isActive === 'true');
  }

  if (sort === 'reported_count') {
    query = query.order('reported_count', { ascending: false });
  } else {
    query = query.order('updated_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  await requireAdmin();

  const { id, ...updates } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('questions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
