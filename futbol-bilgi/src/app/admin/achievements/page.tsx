import { refresh } from 'next/cache';
import { requireAdmin } from '@/lib/admin/guard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { AchievementAdmin } from '@/lib/admin/types';
import { createAdminClient } from '@/lib/supabase/admin';

async function fetchAchievements() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('achievements').select('*').order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as AchievementAdmin[];
}

export default async function AdminAchievementsPage() {
  await requireAdmin();
  const achievements = await fetchAchievements();

  return (
    <div className="space-y-4">
      <Card padding="lg">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Başarımlar</h2>
          <span className="text-sm text-text-secondary">{achievements.length} kayıt</span>
        </div>
      </Card>

      <div className="space-y-3">
        {achievements.map((item) => (
          <Card key={item.id} padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">{item.name}</p>
                <p className="text-xs text-text-secondary">{item.code}</p>
              </div>
              <span className="text-xs text-text-secondary">{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
            </div>
            <form
              action={async (formData) => {
                'use server';
                await requireAdmin();
                const payload = {
                  id: item.id,
                  reward_coins: Number(formData.get('reward_coins')),
                  reward_gems: Number(formData.get('reward_gems')),
                  reward_xp: Number(formData.get('reward_xp')),
                };
                const supabase = createAdminClient();
                const { error } = await supabase.from('achievements').update(payload).eq('id', item.id);

                if (error) {
                  throw new Error(error.message);
                }
                refresh();
              }}
              className="grid gap-2 sm:grid-cols-3"
            >
              <Input name="reward_coins" label="Coin" type="number" defaultValue={item.reward_coins} />
              <Input name="reward_gems" label="Gem" type="number" defaultValue={item.reward_gems} />
              <Input name="reward_xp" label="XP" type="number" defaultValue={item.reward_xp} />
              <Button type="submit" className="sm:col-span-3">Güncelle</Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
