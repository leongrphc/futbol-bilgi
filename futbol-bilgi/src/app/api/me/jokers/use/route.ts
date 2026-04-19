import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { JokerType } from '@/types';

const VALID_JOKERS: JokerType[] = ['fifty_fifty', 'audience', 'phone', 'freeze_time', 'skip', 'double_answer'];

function isJokerType(value: unknown): value is JokerType {
  return typeof value === 'string' && VALID_JOKERS.includes(value as JokerType);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jokerType } = await request.json();

  if (!isJokerType(jokerType)) {
    return NextResponse.json({ error: 'Invalid joker type' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const nextSettings = { ...(profile.settings ?? {}) } as Record<string, unknown>;
  const jokers = ((nextSettings.jokers as Partial<Record<JokerType, number>> | undefined) ?? {});
  const currentStock = jokers[jokerType] ?? 0;

  if (currentStock <= 0) {
    return NextResponse.json({ error: 'Joker stock unavailable' }, { status: 400 });
  }

  nextSettings.jokers = {
    ...jokers,
    [jokerType]: currentStock - 1,
  };

  const { data: updatedProfile, error: updateError } = await admin
    .from('profiles')
    .update({
      settings: nextSettings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { profile: updatedProfile } });
}
