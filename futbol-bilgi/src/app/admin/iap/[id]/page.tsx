import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { requireAdmin } from '@/lib/admin/guard';
import { createAdminClient } from '@/lib/supabase/admin';

async function fetchTransaction(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('iap_transactions')
    .select('*, profiles!inner(username, email)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as {
    id: string;
    product_id: string;
    platform: 'ios' | 'android';
    status: 'pending' | 'verified' | 'rejected' | 'refunded';
    transaction_id: string;
    original_transaction_id: string | null;
    amount_cents: number | null;
    currency: string | null;
    provider_response: Record<string, unknown> | null;
    verified_at: string | null;
    created_at: string;
    updated_at: string;
    profiles: { username: string; email: string };
  } | null;
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

export default async function AdminIapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const transaction = await fetchTransaction(id);

  if (!transaction) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Card padding="lg" className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">IAP İşlem Detayı</h2>
            <p className="text-sm text-text-secondary">{transaction.profiles.username} · {transaction.profiles.email}</p>
          </div>
          <Badge variant={getStatusVariant(transaction.status)}>{transaction.status}</Badge>
        </div>

        <div className="grid gap-3 text-sm text-text-secondary sm:grid-cols-2">
          <div>Ürün: <span className="text-text-primary">{transaction.product_id}</span></div>
          <div>Platform: <span className="text-text-primary">{transaction.platform}</span></div>
          <div>Transaction ID: <span className="text-text-primary">{transaction.transaction_id}</span></div>
          <div>Original Transaction ID: <span className="text-text-primary">{transaction.original_transaction_id ?? '—'}</span></div>
          <div>Tutar: <span className="text-text-primary">{transaction.amount_cents ?? '—'}</span></div>
          <div>Para Birimi: <span className="text-text-primary">{transaction.currency ?? '—'}</span></div>
          <div>Oluşturulma: <span className="text-text-primary">{new Date(transaction.created_at).toLocaleString('tr-TR')}</span></div>
          <div>Doğrulama: <span className="text-text-primary">{transaction.verified_at ? new Date(transaction.verified_at).toLocaleString('tr-TR') : '—'}</span></div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-3">
        <h3 className="font-display text-base font-semibold">Provider Response</h3>
        <pre className="overflow-x-auto rounded-lg bg-bg-elevated p-4 text-xs text-text-secondary">
          {JSON.stringify(transaction.provider_response ?? {}, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
