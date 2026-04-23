import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/supabase/request-auth';

export async function GET(request: Request) {
  const { user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin.from('profiles').select('*').eq('id', user.id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: profile });
}

export async function PATCH(request: Request) {
  const { user } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { settings } = await request.json();
  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: 'Missing settings' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from('profiles').select('settings').eq('id', user.id).single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { data, error } = await admin
    .from('profiles')
    .update({ settings: { ...(profile.settings ?? {}), ...settings }, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
