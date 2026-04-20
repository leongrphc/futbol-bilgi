import Link from 'next/link';
import { Card } from '@/components/ui/card';

const adminModules = [
  {
    title: 'Soru Yönetimi',
    description: 'Soruları düzenle, aktif/pasif yap.',
    href: '/admin/questions',
  },
  {
    title: 'Kullanıcı Yönetimi',
    description: 'Premium ve ekonomi ayarları.',
    href: '/admin/users',
  },
  {
    title: 'Mağaza',
    description: 'Shop item fiyatlarını güncelle.',
    href: '/admin/shop',
  },
  {
    title: 'Başarımlar',
    description: 'Reward ve koşulları yönet.',
    href: '/admin/achievements',
  },
  {
    title: 'IAP İşlemleri',
    description: 'Verify ve transaction kayıtlarını incele.',
    href: '/admin/iap',
  },
];

export default function AdminDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {adminModules.map((module) => (
        <Link key={module.href} href={module.href} className="block">
          <Card padding="lg" hoverable className="h-full">
            <h2 className="font-display text-lg font-semibold">{module.title}</h2>
            <p className="mt-2 text-sm text-text-secondary">{module.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
