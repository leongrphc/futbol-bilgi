'use client';

import { Card } from '@/components/ui/card';

interface AchievementStripProps {
  titles: string[];
}

export function AchievementStrip({ titles }: AchievementStripProps) {
  if (titles.length === 0) return null;

  return (
    <Card padding="md" variant="highlighted">
      <p className="text-xs font-medium uppercase tracking-wide text-secondary-500">Yeni Başarım</p>
      <p className="mt-2 text-sm text-text-primary">
        {titles.join(', ')} başarımını açtın.
      </p>
    </Card>
  );
}
