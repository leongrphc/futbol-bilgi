import { Card } from '@/components/ui/card';
import { requireAdmin } from '@/lib/admin/guard';
import { createAdminClient } from '@/lib/supabase/admin';

async function fetchIapTransactions() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('iap_transactions')
    .select('*, profiles!inner(username, email)')
    .order('created_at', { ascending: false })
    .limit(50);

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

const STATUS_STYLES = {
  pending: 'bg-bg-elevated text-text-secondary',
  verified: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
  refunded: 'bg-warning/15 text-warning',
} as const;

export default async function AdminIapPage() {
  await requireAdmin();
  const transactions = await fetchIapTransactions();

  return (
    <div className="space-y-4">
      <Card padding="lg" className="space-y-2">
        <h2 className="font-display text-lg font-semibold">IAP İşlemleri</h2>
        <p className="text-sm text-text-secondary">Son 50 doğrulama ve satın alma kaydı.</p>
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
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[transaction.status]}`}>
                {transaction.status}
              </span>
            </div>

            <div className="grid gap-2 text-xs text-text-secondary sm:grid-cols-2">
              <div>Oluşturulma: {new Date(transaction.created_at).toLocaleString('tr-TR')}</div>
              <div>Doğrulama: {transaction.verified_at ? new Date(transaction.verified_at).toLocaleString('tr-TR') : '—'}</div>
              <div>Provider: {transaction.provider_response?.provider ?? '—'}</div>
              <div>Sebep: {transaction.provider_response?.reason ?? '—'}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
