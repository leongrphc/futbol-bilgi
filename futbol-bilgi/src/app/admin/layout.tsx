import { requireAdmin } from '@/lib/admin/guard';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Card padding="lg" className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold">Admin Panel</h1>
              <p className="text-sm text-text-secondary">İçerik ve kullanıcı yönetimi</p>
            </div>
            <nav className="flex flex-wrap gap-2 text-sm">
              <Link href="/admin" className="rounded-lg bg-bg-elevated px-3 py-1.5">Dashboard</Link>
              <Link href="/admin/questions" className="rounded-lg bg-bg-elevated px-3 py-1.5">Sorular</Link>
              <Link href="/admin/users" className="rounded-lg bg-bg-elevated px-3 py-1.5">Kullanıcılar</Link>
              <Link href="/admin/shop" className="rounded-lg bg-bg-elevated px-3 py-1.5">Mağaza</Link>
              <Link href="/admin/achievements" className="rounded-lg bg-bg-elevated px-3 py-1.5">Başarımlar</Link>
            </nav>
          </div>
        </Card>
        {children}
      </div>
    </div>
  );
}
