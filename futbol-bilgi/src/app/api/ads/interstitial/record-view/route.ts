import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/supabase/request-auth';

export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { placement } = await request.json();
  const admin = createAdminClient();

  const { error } = await admin.from('ad_interstitial_views').insert({
    user_id: user.id,
    placement: typeof placement === 'string' ? placement : 'quick_result',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } });
}
