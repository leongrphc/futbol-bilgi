import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { requireAdmin } from '@/lib/admin/guard';
import { createAdminClient } from '@/lib/supabase/admin';

interface IapSearchParams {
  search?: string;
  status?: string;
  platform?: string;
}

async function fetchIapTransactions(searchParams: IapSearchParams) {
  const supabase = createAdminClient();
  let query = supabase
    .from('iap_transactions')
    .select('*, profiles!inner(username, email)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (searchParams.search) {
    const search = searchParams.search.trim();
    query = query.or(`transaction_id.ilike.%${search}%,product_id.ilike.%${search}%,profiles.username.ilike.%${search}%,profiles.email.ilike.%${search}%`);
  }

  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }

  if (searchParams.platform) {
    query = query.eq('platform', searchParams.platform);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Array<{
    id: string;
    user_id: string;
    product_id: string;
    platform: 'ios' | 'android';
    status: 'pending' | 'verified' | 'rejected' | 'refunded';
    transaction_id: string;
    verified_at: string | null;
    created_at: string;
    provider_response: { provider?: string; reason?: string } | null;
    profiles: { username: string; email: string };
  }>;
}

function getStatusVariant(status: 'pending' | 'verified' | 'rejected' | 'refunded') {
  switch (status) {
    case 'verified':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'refunded':
      return 'warning';
    default:
      return 'default';
  }
}

export default async function AdminIapPage({
  searchParams,
}: {
  searchParams: Promise<IapSearchParams>;
}) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const transactions = await fetchIapTransactions(resolvedSearchParams);

  return (
    <div className="space-y-4">
      <Card padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">IAP İşlemleri</h2>
            <p className="text-sm text-text-secondary">Son 50 doğrulama ve satın alma kaydı.</p>
          </div>
          <span className="text-sm text-text-secondary">{transactions.length} kayıt</span>
        </div>

        <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" action="/admin/iap" method="get">
          <Input name="search" placeholder="Kullanıcı, email, ürün, transaction" defaultValue={resolvedSearchParams.search || ''} />
          <Input name="status" placeholder="status (verified/rejected/pending/refunded)" defaultValue={resolvedSearchParams.status || ''} />
          <Input name="platform" placeholder="platform (ios/android)" defaultValue={resolvedSearchParams.platform || ''} />
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit">Filtrele</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <Card key={transaction.id} padding="md" className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium text-text-primary">{transaction.profiles.username}</p>
                <p className="text-xs text-text-secondary">{transaction.profiles.email}</p>
                <p className="text-xs text-text-secondary">
                  {transaction.product_id} · {transaction.platform} · {transaction.transaction_id}
                </p>
              </div>
              <Badge variant={getStatusVariant(transaction.status)}>{transaction.status}</Badge>
            </div>

            <div className="grid gap-2 text-xs text-text-secondary sm:grid-cols-2">
              <div>Oluşturulma: {new Date(transaction.created_at).toLocaleString('tr-TR')}</div>
              <div>Doğrulama: {transaction.verified_at ? new Date(transaction.verified_at).toLocaleString('tr-TR') : '—'}</div>
              <div>Provider: {transaction.provider_response?.provider ?? '—'}</div>
              <div>Sebep: {transaction.provider_response?.reason ?? '—'}</div>
            </div>

            <div className="flex justify-end">
              <Link href={`/admin/iap/${transaction.id}`} className="text-sm text-primary-500">
                Detaylar
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
