import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AD_CONFIG } from '@/lib/constants/ads';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const placement = searchParams.get('placement') ?? 'quick_result';
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ count: shownToday, error: shownError }, { count: completedSessions, error: sessionsError }] = await Promise.all([
    admin
      .from('ad_interstitial_views')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('view_date', today),
    admin
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('ended_at', 'is', null),
  ]);

  if (shownError || sessionsError) {
    return NextResponse.json({ error: shownError?.message ?? sessionsError?.message }, { status: 500 });
  }

  const shouldShow = (completedSessions ?? 0) > 0
    && (completedSessions ?? 0) % AD_CONFIG.interstitial.sessionInterval === 0
    && (shownToday ?? 0) < AD_CONFIG.interstitial.dailyLimit;

  return NextResponse.json({ data: { shouldShow, placement } });
}
