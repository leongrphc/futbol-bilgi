import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/supabase/request-auth';

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, tier, result } = body;

    if (!user_id || !tier || !result) {
      return NextResponse.json(
        { error: 'user_id, tier, and result are required' },
        { status: 400 }
      );
    }

    if (!['win', 'draw', 'loss'].includes(result)) {
      return NextResponse.json(
        { error: 'result must be win, draw, or loss' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.rpc('record_duel_result', {
      p_user_id: user_id,
      p_tier: tier,
      p_result: result,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording duel result:', error);
    return NextResponse.json(
      { error: 'Failed to record duel result' },
      { status: 500 }
    );
  }
}
