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

async function findSimilarQuestion(questionText: string, draftId: string) {
  const supabase = createAdminClient();
  const snippet = questionText.slice(0, 24);
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, is_active')
    .neq('id', draftId)
    .ilike('question_text', `%${snippet}%`)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function getDraftChecklist(draft: QuestionAdmin) {
  return {
    hasExplanation: Boolean(draft.explanation?.trim()),
    hasFourOptions: Array.isArray(draft.options) && draft.options.length === 4,
    hasTeamTags: Array.isArray(draft.team_tags) && draft.team_tags.length > 0,
    hasSeasonRange: Boolean(draft.season_range?.trim()),
  };
}

function getChecklistIssues(checklist: ReturnType<typeof getDraftChecklist>) {
  return [
    checklist.hasExplanation ? null : 'Açıklama eksik',
    checklist.hasFourOptions ? null : '4 seçenek tamamlanmalı',
    checklist.hasTeamTags ? null : 'En az 1 team tag eklenmeli',
    checklist.hasSeasonRange ? null : 'Sezon aralığı gerekli',
  ].filter(Boolean) as string[];
}

function getScopeLabel(scope: string) {
  if (scope === 'europe') return 'Avrupa';
  if (scope === 'world') return 'Dünya';
  return 'Türkiye';
}

function getReadinessVariant(readinessScore: number) {
  if (readinessScore === 4) return 'success';
  if (readinessScore >= 2) return 'warning';
  return 'danger';
}

async function generateQuestions(formData: FormData) {
  'use server';

  await requireAdmin();

  const topic = String(formData.get('topic') || '').trim();
  const rawLeagueScope = String(formData.get('league_scope') || 'turkey').trim();
  const rawDifficulty = Number(formData.get('difficulty') || 3);
  const rawCount = Number(formData.get('count') || 3);

  if (!topic) {
    throw new Error('Taslak üretmek için konu girmelisin.');
  }

  if (topic.length < 3) {
    throw new Error('Konu en az 3 karakter olmalı.');
  }

  const leagueScope = rawLeagueScope === 'europe' || rawLeagueScope === 'world' ? rawLeagueScope : 'turkey';
  const difficulty = Number.isFinite(rawDifficulty) ? Math.max(1, Math.min(5, rawDifficulty)) : 3;
  const count = Number.isFinite(rawCount) ? Math.max(1, Math.min(5, rawCount)) : 3;

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const response = await fetch(`${origin}/api/admin/questions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, league_scope: leagueScope, difficulty, count }),
    cache: 'no-store',
  });

  const json = await response.json();
  if (!response.ok || !json.data) {
    throw new Error(json.error || 'Taslak üretimi tamamlanamadı.');
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

  const draftReviews = await Promise.all(
    drafts.map(async (draft) => ({
      draft,
      checklist: getDraftChecklist(draft),
      similarQuestion: await findSimilarQuestion(draft.question_text, draft.id),
    })),
  );

  const readyDraftCount = draftReviews.filter(({ checklist }) => Object.values(checklist).every(Boolean)).length;
  const flaggedDraftCount = draftReviews.length - readyDraftCount;

  return (
    <div className="space-y-4">
      <Card padding="lg" className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Taslak Soru Üretimi</h2>
          <p className="text-sm text-text-secondary">Taslak üret, editoryal kontrol yap, ardından yalnızca hazır kayıtları yayına al.</p>
          <p className="mt-1 text-xs text-text-muted">Bu akış şu anda mock üretim kullanıyor. Üretilen içerikler yayınlanmadan önce editör tarafından doğrulanmalı.</p>
        </div>
        <form action={generateQuestions} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input name="topic" label="Konu" placeholder="Örn: Premier League derbileri" minLength={3} maxLength={80} required />
          <Input name="league_scope" label="Lig Scope" placeholder="turkey / europe / world" defaultValue="turkey" />
          <Input name="difficulty" label="Zorluk" type="number" min={1} max={5} placeholder="1-5" defaultValue="3" />
          <Input name="count" label="Taslak Sayısı" type="number" min={1} max={5} placeholder="1-5" defaultValue="3" />
          <div className="xl:col-span-4 space-y-2">
            <Button type="submit">Taslak Üret</Button>
            <p className="text-xs text-text-muted">Kısa ve net konu gir. Scope yalnızca turkey, europe veya world olmalı.</p>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card padding="md" variant="elevated" className="space-y-1">
          <p className="text-xs text-text-secondary">Bekleyen taslak</p>
          <p className="font-display text-2xl font-bold text-text-primary">{draftReviews.length}</p>
        </Card>
        <Card padding="md" variant="elevated" className="space-y-1">
          <p className="text-xs text-text-secondary">Yayına hazır</p>
          <p className="font-display text-2xl font-bold text-success">{readyDraftCount}</p>
        </Card>
        <Card padding="md" variant="elevated" className="space-y-1">
          <p className="text-xs text-text-secondary">İnceleme gereken</p>
          <p className="font-display text-2xl font-bold text-warning">{flaggedDraftCount}</p>
        </Card>
      </div>

      <Card padding="lg" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Taslak İnceleme Kuyruğu</h2>
            <p className="text-sm text-text-secondary">Checklist, benzer kayıt uyarısı ve eksik alanları tek kartta gör.</p>
            <p className="mt-1 text-xs text-text-muted">Benzer soru uyarısı karar desteğidir; otomatik engelleme yapmaz.</p>
          </div>
          <span className="text-sm text-text-secondary">{draftReviews.length} taslak</span>
        </div>

        <div className="space-y-3">
          {draftReviews.length === 0 ? (
            <Card padding="md" variant="elevated" className="text-center">
              <p className="text-sm text-text-secondary">Bekleyen taslak yok. Yeni bir konu girerek inceleme kuyruğunu doldurabilirsin.</p>
            </Card>
          ) : (
            draftReviews.map(({ draft, checklist, similarQuestion }) => {
              const readinessScore = Object.values(checklist).filter(Boolean).length;
              const isReady = Object.values(checklist).every(Boolean);
              const issues = getChecklistIssues(checklist);
              const correctOptionText = draft.options.find((option) => option.key === draft.correct_answer)?.text ?? draft.correct_answer;

              return (
                <Card key={draft.id} padding="md" className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-text-secondary">{getScopeLabel(draft.league_scope)} · {draft.league} · Zorluk {draft.difficulty}</p>
                      <p className="font-medium text-text-primary">{draft.question_text}</p>
                      <p className="mt-1 text-xs text-text-muted">{draft.category} / {draft.sub_category ?? 'alt kategori yok'} · {draft.season_range ?? 'sezon belirtilmedi'}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Badge variant={getReadinessVariant(readinessScore)}>
                        {isReady ? 'Hazır' : readinessScore >= 2 ? 'İnceleme Gerekli' : 'Zayıf Taslak'}
                      </Badge>
                      <Badge variant="warning">Taslak</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-3">
                    <Card padding="sm" variant="elevated" className="space-y-2">
                      <p className="text-xs font-semibold text-text-secondary">Oyuncuya gösterilecek önizleme</p>
                      <p className="text-sm text-text-primary">{draft.question_text}</p>
                      <p className="text-xs text-text-secondary">Şıklar: {draft.options.map((option) => `${option.key}) ${option.text}`).join(' · ')}</p>
                      <p className="text-xs text-text-secondary">Doğru cevap: {correctOptionText}</p>
                      <p className="text-xs text-text-secondary">Açıklama: {draft.explanation ?? 'Açıklama eksik'}</p>
                    </Card>

                    <Card padding="sm" variant="elevated" className="space-y-2">
                      <p className="text-xs font-semibold text-text-secondary">Yayın checklist&apos;i</p>
                      <ul className="space-y-1 text-xs text-text-secondary">
                        <li>{checklist.hasExplanation ? '✓' : '✗'} Açıklama var</li>
                        <li>{checklist.hasFourOptions ? '✓' : '✗'} 4 seçenek var</li>
                        <li>{checklist.hasTeamTags ? '✓' : '✗'} Team tag var</li>
                        <li>{checklist.hasSeasonRange ? '✓' : '✗'} Sezon aralığı var</li>
                      </ul>
                      <p className="text-xs font-medium text-text-primary">{readinessScore}/4 kontrol geçti</p>
                      {issues.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {issues.map((issue) => (
                            <Badge key={issue} variant="warning">{issue}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-success">Temel yayına alma kontrolleri tamamlandı.</p>
                      )}
                    </Card>

                    <Card padding="sm" variant="elevated" className="space-y-2">
                      <p className="text-xs font-semibold text-text-secondary">İnceleme sinyalleri</p>
                      <p className="text-xs text-text-secondary">Takım etiketleri: {draft.team_tags.length > 0 ? draft.team_tags.join(', ') : 'etiket yok'}</p>
                      <p className="text-xs text-text-secondary">Dönem etiketi: {draft.era_tag ?? 'belirtilmedi'}</p>
                      {similarQuestion ? (
                        <>
                          <Badge variant="warning">Benzer soru uyarısı</Badge>
                          <p className="text-xs text-text-secondary">{similarQuestion.is_active ? 'Aktif' : 'Taslak'} benzer kayıt bulundu: {similarQuestion.question_text}</p>
                        </>
                      ) : (
                        <p className="text-xs text-text-secondary">Benzer kayıt bulunmadı.</p>
                      )}
                    </Card>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <form action={publishDraft}>
                      <input type="hidden" name="id" value={draft.id} />
                      <Button type="submit" variant="secondary" fullWidth disabled={!isReady}>Yayına Al</Button>
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
              );
            })
          )}
        </div>
      </Card>

      <Card padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Sorular</h2>
            <p className="text-xs text-text-muted">Aktif ve pasif kayıtları aynı listede izleyebilirsin.</p>
          </div>
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
        {questions.length === 0 ? (
          <Card padding="md" className="text-center">
            <p className="text-sm text-text-secondary">Bu filtrelerle eşleşen soru bulunamadı.</p>
          </Card>
        ) : (
          questions.map((question) => (
            <Card key={question.id} padding="md" className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-text-secondary">
                    {getScopeLabel(question.league_scope)} · {question.league} · Zorluk {question.difficulty}
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
          ))
        )}
      </div>
    </div>
  );
}
