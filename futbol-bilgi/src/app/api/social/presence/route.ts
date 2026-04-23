import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/supabase/request-auth';

export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select('id, last_seen_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
