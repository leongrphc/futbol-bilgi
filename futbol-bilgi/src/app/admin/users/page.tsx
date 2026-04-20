import { refresh } from 'next/cache';
import { requireAdmin } from '@/lib/admin/guard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { UserAdmin } from '@/lib/admin/types';
import { createAdminClient } from '@/lib/supabase/admin';

async function fetchUsers(search = '') {
  const supabase = createAdminClient();
  let query = supabase.from('profiles').select('*').limit(50);

  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as UserAdmin[];
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const users = await fetchUsers(resolvedSearchParams.search || '');

  return (
    <div className="space-y-4">
      <Card padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Kullanıcılar</h2>
          <span className="text-sm text-text-secondary">{users.length} kayıt</span>
        </div>
        <form className="flex gap-2" action="/admin/users" method="get">
          <Input name="search" placeholder="Kullanıcı adı veya e-posta" defaultValue={resolvedSearchParams.search || ''} />
          <Button type="submit">Ara</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id} padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">{user.username}</p>
                <p className="text-xs text-text-secondary">{user.email}</p>
              </div>
              <span className="text-xs text-text-secondary">{new Date(user.updated_at).toLocaleString('tr-TR')}</span>
            </div>
            <form
              action={async (formData) => {
                'use server';
                await requireAdmin();
                const payload = {
                  id: user.id,
                  is_premium: formData.get('is_premium') === 'on',
                  coins: Number(formData.get('coins')),
                  gems: Number(formData.get('gems')),
                  energy: Number(formData.get('energy')),
                  xp: Number(formData.get('xp')),
                };
                const supabase = createAdminClient();
                const { error } = await supabase
                  .from('profiles')
                  .update({ ...payload, updated_at: new Date().toISOString() })
                  .eq('id', user.id);

                if (error) {
                  throw new Error(error.message);
                }
                refresh();
              }}
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
            >
              <Input name="coins" label="Coin" type="number" defaultValue={user.coins} />
              <Input name="gems" label="Gem" type="number" defaultValue={user.gems} />
              <Input name="energy" label="Enerji" type="number" defaultValue={user.energy} />
              <Input name="xp" label="XP" type="number" defaultValue={user.xp} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_premium" defaultChecked={user.is_premium} />
                Premium
              </label>
              <Button type="submit" className="sm:col-span-2 lg:col-span-5">Güncelle</Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
