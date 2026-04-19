import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const allowlist = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (allowlist.length === 0 && process.env.NODE_ENV !== 'production') {
    return user;
  }

  if (!allowlist.includes(user.id)) {
    redirect('/');
  }

  return user;
}
