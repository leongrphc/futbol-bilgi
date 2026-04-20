import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/admin/guard';
import type { QuestionAdmin } from '@/lib/admin/types';
import { createAdminClient } from '@/lib/supabase/admin';

async function fetchQuestions(searchParams: { search?: string; league_scope?: string; difficulty?: string; is_active?: string; sort?: string }) {
  const supabase = createAdminClient();
  const sort = searchParams.sort || 'updated_at';

  let query = supabase.from('questions').select('*').limit(50);

  if (searchParams.search) {
    query = query.ilike('question_text', `%${searchParams.search}%`);
  }

  if (searchParams.league_scope) {
    query = query.eq('league_scope', searchParams.league_scope);
  }

  if (searchParams.difficulty) {
    query = query.eq('difficulty', Number(searchParams.difficulty));
  }

  if (searchParams.is_active !== undefined) {
    query = query.eq('is_active', searchParams.is_active === 'true');
  }

  if (sort === 'reported_count') {
    query = query.order('reported_count', { ascending: false });
  } else {
    query = query.order('updated_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as QuestionAdmin[];
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; league_scope?: string; difficulty?: string; is_active?: string; sort?: string }>;
}) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const questions = await fetchQuestions(resolvedSearchParams);

  return (
    <div className="space-y-4">
      <Card padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Sorular</h2>
          <span className="text-sm text-text-secondary">{questions.length} kayıt</span>
        </div>
        <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5" action="/admin/questions" method="get">
          <Input name="search" placeholder="Soru ara" defaultValue={resolvedSearchParams.search || ''} />
          <Input name="league_scope" placeholder="league_scope" defaultValue={resolvedSearchParams.league_scope || ''} />
          <Input name="difficulty" placeholder="Zorluk (1-5)" defaultValue={resolvedSearchParams.difficulty || ''} />
          <Input name="is_active" placeholder="is_active (true/false)" defaultValue={resolvedSearchParams.is_active || ''} />
          <Input name="sort" placeholder="sort (updated_at/reported_count)" defaultValue={resolvedSearchParams.sort || ''} />
          <div className="lg:col-span-5">
            <Button type="submit">Filtrele</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {questions.map((question) => (
          <Card key={question.id} padding="md" className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-text-secondary">
                  {question.league_scope} · {question.league} · Zorluk {question.difficulty}
                </p>
                <p className="font-medium text-text-primary">{question.question_text}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={question.is_active ? 'success' : 'danger'}>
                  {question.is_active ? 'Aktif' : 'Pasif'}
                </Badge>
                {question.reported_count > 0 && (
                  <Badge variant="warning">{question.reported_count} rapor</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-text-secondary">{new Date(question.updated_at).toLocaleString('tr-TR')}</div>
              <Link href={`/admin/questions/${question.id}`} className="text-sm text-primary-500">Düzenle</Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
