import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';
type Mode = 'overall' | 'millionaire' | 'duel';

function isPeriod(value: string | null): value is Period {
  return value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'all_time';
}

function isMode(value: string | null): value is Mode {
  return value === 'overall' || value === 'millionaire' || value === 'duel';
}

function getPeriodStart(period: Exclude<Period, 'all_time'>) {
  const start = new Date();

  if (period === 'daily') {
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }

  if (period === 'weekly') {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }

  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const rawPeriod = searchParams.get('period');
    const rawMode = searchParams.get('mode');
    const limit = limitParam ? Math.min(Number(limitParam), 200) : 100;
    const period: Period = isPeriod(rawPeriod) ? rawPeriod : 'all_time';
    const mode: Mode = isMode(rawMode) ? rawMode : 'overall';

    const supabase = await createClient();

    if (mode === 'overall' && period === 'all_time') {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, avatar_frame, league_tier, xp')
        .order('xp', { ascending: false })
        .limit(Number.isFinite(limit) ? limit : 100);

      if (error) throw error;

      return NextResponse.json({
        data: (data ?? []).map((player) => ({
          id: player.id,
          username: player.username,
          avatar_url: player.avatar_url,
          avatar_frame: player.avatar_frame,
          league_tier: player.league_tier,
          score: player.xp,
        })),
        meta: {
          mode,
          period,
          label: 'XP sıralaması',
          supported: true,
        },
      });
    }

    const sessionMode = mode === 'overall' ? null : mode;
    const since = period === 'all_time' ? null : getPeriodStart(period);

    let query = supabase
      .from('game_sessions')
      .select('user_id, score, profiles!inner(username, avatar_url, avatar_frame, league_tier)')
      .not('ended_at', 'is', null)
      .order('score', { ascending: false })
      .limit(1000);

    if (sessionMode) {
      query = query.eq('mode', sessionMode);
    }

    if (since) {
      query = query.gte('created_at', since);
    }

    const { data, error } = await query;
    if (error) throw error;

    const totals = new Map<string, {
      id: string;
      username: string;
      avatar_url: string | null;
      avatar_frame: string | null;
      league_tier: string;
      score: number;
    }>();

    for (const row of data ?? []) {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      if (!profile) {
        continue;
      }

      const current = totals.get(row.user_id);
      if (current) {
        current.score += row.score ?? 0;
        continue;
      }

      totals.set(row.user_id, {
        id: row.user_id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        avatar_frame: profile.avatar_frame,
        league_tier: profile.league_tier,
        score: row.score ?? 0,
      });
    }

    const ranked = [...totals.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, Number.isFinite(limit) ? limit : 100);

    return NextResponse.json({
      data: ranked,
      meta: {
        mode,
        period,
        label: mode === 'duel' ? 'Düello puanı' : mode === 'millionaire' ? 'Milyoner puanı' : 'Oyun puanı',
        supported: true,
      },
    });
  } catch (error) {
    console.error('Error fetching overall leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overall leaderboard' },
      { status: 500 }
    );
  }
}
