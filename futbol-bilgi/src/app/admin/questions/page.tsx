import Link from 'next/link';
import { revalidatePath } from 'next/cache';
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

  if (searchParams.is_active !== undefined && searchParams.is_active !== '') {
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

async function fetchDraftQuestions() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', false)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return data as QuestionAdmin[];
}

async function generateQuestions(formData: FormData) {
  'use server';

  await requireAdmin();

  const topic = String(formData.get('topic') || '').trim();
  const leagueScope = String(formData.get('league_scope') || 'turkey');
  const difficulty = Number(formData.get('difficulty') || 3);
  const count = Number(formData.get('count') || 3);

  if (!topic) {
    return;
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const response = await fetch(`${origin}/api/admin/questions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, league_scope: leagueScope, difficulty, count }),
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok || !json.data) {
    throw new Error(json.error || 'AI soru taslağı üretilemedi.');
  }

  const supabase = createAdminClient();
  const payload = json.data.map((draft: {
    league_scope: string;
    league: string;
    category: string;
    sub_category: string;
    difficulty: number;
    season_range: string;
    team_tags: string[];
    era_tag: string;
    question_text: string;
    options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
    correct_answer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    is_active: boolean;
  }) => ({
    ...draft,
    media: null,
    times_shown: 0,
    times_correct: 0,
    avg_answer_time_ms: 0,
    reported_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('questions').insert(payload);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/questions');
}

async function publishDraft(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') || '');
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('questions')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/questions');
}

async function deleteDraft(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') || '');
  const supabase = createAdminClient();
  const { error } = await supabase.from('questions').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/admin/questions');
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; league_scope?: string; difficulty?: string; is_active?: string; sort?: string }>;
}) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const [questions, drafts] = await Promise.all([
    fetchQuestions(resolvedSearchParams),
    fetchDraftQuestions(),
  ]);

  return (
    <div className="space-y-4">
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">AI Soru Üretimi</h2>
            <p className="text-sm text-text-secondary">Taslak üret, editoryal kontrol yap, sonra yayına al.</p>
          </div>
        </div>
        <form action={generateQuestions} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input name="topic" label="Konu" placeholder="Örn: Premier League derbileri" />
          <Input name="league_scope" label="Lig Scope" placeholder="turkey / europe / world" defaultValue="turkey" />
          <Input name="difficulty" label="Zorluk" placeholder="1-5" defaultValue="3" />
          <Input name="count" label="Taslak Sayısı" placeholder="1-5" defaultValue="3" />
          <div className="xl:col-span-4">
            <Button type="submit">AI Taslak Üret</Button>
          </div>
        </form>
      </Card>

      <Card padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Taslak İnceleme Kuyruğu</h2>
          <span className="text-sm text-text-secondary">{drafts.length} taslak</span>
        </div>
        <div className="space-y-3">
          {drafts.length === 0 ? (
            <p className="text-sm text-text-secondary">Bekleyen AI taslağı yok.</p>
          ) : (
            drafts.map((draft) => (
              <Card key={draft.id} padding="md" className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">{draft.league_scope} · {draft.league} · Zorluk {draft.difficulty}</p>
                    <p className="font-medium text-text-primary">{draft.question_text}</p>
                    <p className="mt-2 text-xs text-text-secondary">Doğru cevap: {draft.correct_answer} · Açıklama: {draft.explanation}</p>
                  </div>
                  <Badge variant="warning">Taslak</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <form action={publishDraft}>
                    <input type="hidden" name="id" value={draft.id} />
                    <Button type="submit" variant="secondary" fullWidth>Yayına Al</Button>
                  </form>
                  <form action={deleteDraft}>
                    <input type="hidden" name="id" value={draft.id} />
                    <Button type="submit" variant="ghost" fullWidth>Sil</Button>
                  </form>
                  <Link href={`/admin/questions/${draft.id}`}>
                    <Button variant="outline" fullWidth>Düzenle</Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

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
