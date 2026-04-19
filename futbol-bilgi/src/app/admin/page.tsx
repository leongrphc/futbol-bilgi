import { Card } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card padding="lg">
        <h2 className="font-display text-lg font-semibold">Soru Yönetimi</h2>
        <p className="text-sm text-text-secondary mt-2">Soruları düzenle, aktif/pasif yap.</p>
      </Card>
      <Card padding="lg">
        <h2 className="font-display text-lg font-semibold">Kullanıcı Yönetimi</h2>
        <p className="text-sm text-text-secondary mt-2">Premium ve ekonomi ayarları.</p>
      </Card>
      <Card padding="lg">
        <h2 className="font-display text-lg font-semibold">Mağaza</h2>
        <p className="text-sm text-text-secondary mt-2">Shop item fiyatlarını güncelle.</p>
      </Card>
      <Card padding="lg">
        <h2 className="font-display text-lg font-semibold">Başarımlar</h2>
        <p className="text-sm text-text-secondary mt-2">Reward ve koşulları yönet.</p>
      </Card>
    </div>
  );
}
