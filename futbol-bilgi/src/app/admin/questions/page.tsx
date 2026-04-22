import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/admin/guard';
import type { QuestionAdmin } from '@/lib/admin/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildQuestionInsertPayload, parseCsvImport } from '@/lib/admin/question-import';
import { QuestionImportPreview } from '@/components/admin/question-import-preview';

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

function buildAdminQuestionsUrl(params: Record<string, string | number | null | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `/admin/questions?${query}` : '/admin/questions';
}

async function createManualQuestion(formData: FormData) {
  'use server';

  await requireAdmin();

  try {
    const payload = buildQuestionInsertPayload({
      league_scope: String(formData.get('league_scope') || 'turkey'),
      league: String(formData.get('league') || ''),
      category: String(formData.get('category') || ''),
      sub_category: String(formData.get('sub_category') || ''),
      difficulty: String(formData.get('difficulty') || ''),
      season_range: String(formData.get('season_range') || ''),
      team_tags: String(formData.get('team_tags') || ''),
      era_tag: String(formData.get('era_tag') || ''),
      question_text: String(formData.get('question_text') || ''),
      correct_answer: String(formData.get('correct_answer') || ''),
      explanation: String(formData.get('explanation') || ''),
      option_a: String(formData.get('option_a') || ''),
      option_b: String(formData.get('option_b') || ''),
      option_c: String(formData.get('option_c') || ''),
      option_d: String(formData.get('option_d') || ''),
      is_active: formData.get('is_active') === 'on',
    });

    const supabase = createAdminClient();
    const { data: existingQuestion, error: existingError } = await supabase
      .from('questions')
      .select('id')
      .eq('question_text', payload.question_text)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existingQuestion) {
      redirect(buildAdminQuestionsUrl({ create: 'error', message: 'Aynı soru metniyle kayıt zaten mevcut.' }));
    }

    const { error } = await supabase.from('questions').insert(payload);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/admin/questions');
    redirect(buildAdminQuestionsUrl({ create: 'success', message: 'Soru başarıyla eklendi.' }));
  } catch (error) {
    redirect(buildAdminQuestionsUrl({ create: 'error', message: error instanceof Error ? error.message : 'Soru eklenemedi.' }));
  }
}

async function importQuestionsFromCsv(formData: FormData) {
  'use server';

  await requireAdmin();

  const file = formData.get('csv_file');
  if (!(file instanceof File) || file.size === 0) {
    redirect(buildAdminQuestionsUrl({ import: 'error', message: 'Lütfen bir CSV dosyası seç.' }));
  }

  try {
    const content = await file.text();
    const importActive = formData.get('import_active') === 'on';
    const { payloads, errors } = parseCsvImport(content, importActive);

    if (payloads.length === 0) {
      redirect(buildAdminQuestionsUrl({ import: 'error', message: errors[0] ?? 'İçe aktarılacak geçerli satır bulunamadı.' }));
    }

    const supabase = createAdminClient();
    const questionTexts = payloads.map((payload) => payload.question_text);
    const { data: existingQuestions, error: existingError } = await supabase
      .from('questions')
      .select('question_text')
      .in('question_text', questionTexts);

    if (existingError) {
      throw new Error(existingError.message);
    }

    const existingSet = new Set((existingQuestions ?? []).map((question) => String(question.question_text).toLocaleLowerCase('tr-TR')));
    const validPayloads = payloads.filter((payload) => !existingSet.has(payload.question_text.toLocaleLowerCase('tr-TR')));
    const duplicateCount = payloads.length - validPayloads.length;
    const totalErrors = errors.length + duplicateCount;

    if (validPayloads.length === 0) {
      redirect(buildAdminQuestionsUrl({ import: 'error', message: 'Tüm satırlar hatalı veya mevcut kayıtlarla çakışıyor.', imported: 0, failed: totalErrors }));
    }

    const { error } = await supabase.from('questions').insert(validPayloads);
    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/admin/questions');
    redirect(buildAdminQuestionsUrl({ import: 'success', imported: validPayloads.length, failed: totalErrors }));
  } catch (error) {
    redirect(buildAdminQuestionsUrl({ import: 'error', message: error instanceof Error ? error.message : 'CSV içe aktarma başarısız oldu.' }));
  }
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
  searchParams: Promise<{ search?: string; league_scope?: string; difficulty?: string; is_active?: string; sort?: string; create?: string; import?: string; message?: string; imported?: string; failed?: string }>;
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
  const feedbackVariant = resolvedSearchParams.create === 'success' || resolvedSearchParams.import === 'success' ? 'success' : resolvedSearchParams.message ? 'danger' : null;
  const importSummary = resolvedSearchParams.imported || resolvedSearchParams.failed
    ? `${resolvedSearchParams.imported ?? '0'} içe aktarıldı · ${resolvedSearchParams.failed ?? '0'} hata/çakışma`
    : null;
  const importFeedbackTitle = resolvedSearchParams.import === 'success' ? 'CSV içe aktarma tamamlandı' : resolvedSearchParams.import === 'error' ? 'CSV içe aktarma başarısız' : null;

  return (
    <div className="space-y-4">
      {resolvedSearchParams.message ? (
        <Card padding="md" className={feedbackVariant === 'success' ? 'border-success/30 bg-success/10' : 'border-danger/30 bg-danger/10'}>
          {importFeedbackTitle ? <p className="text-sm font-semibold text-text-primary">{importFeedbackTitle}</p> : null}
          <p className="text-sm text-text-primary">{resolvedSearchParams.message}</p>
          {importSummary ? <p className="mt-1 text-xs text-text-secondary">{importSummary}</p> : null}
          {resolvedSearchParams.import === 'error' ? <p className="mt-1 text-xs text-text-secondary">Satır bazlı önizleme için aşağıdaki CSV Önizleme alanını kullanabilirsin.</p> : null}
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card padding="lg" className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Tekli Soru Ekle</h2>
            <p className="text-sm text-text-secondary">Soruyu doğrudan aktif olarak ekle. Oyun havuzuna girecek kayıtlar için zorunlu alanları eksiksiz doldur.</p>
          </div>
          <form action={createManualQuestion} className="space-y-4">
            <Input name="question_text" label="Soru Metni" placeholder="Örn: 2002 Dünya Kupası'nda Türkiye kaçıncı oldu?" required />
            <div className="grid gap-4 md:grid-cols-2">
              <Input name="option_a" label="Şık A" required />
              <Input name="option_b" label="Şık B" required />
              <Input name="option_c" label="Şık C" required />
              <Input name="option_d" label="Şık D" required />
              <Input name="correct_answer" label="Doğru Cevap" placeholder="A / B / C / D" maxLength={1} pattern="[ABCDabcd]" required />
              <Input name="difficulty" label="Zorluk" type="number" min={1} max={5} defaultValue="3" required />
              <Input name="league_scope" label="Lig Scope" placeholder="turkey / europe / world" defaultValue="turkey" required />
              <Input name="league" label="Lig Kodu" placeholder="super_lig / champions_league / world_cup" />
              <Input name="category" label="Kategori" placeholder="Tarih" required />
              <Input name="sub_category" label="Alt Kategori" placeholder="Dünya Kupası" />
              <Input name="season_range" label="Sezon Aralığı" placeholder="Örn: 2002 veya 2018-2024" />
              <Input name="era_tag" label="Dönem Etiketi" placeholder="modern / classic / legendary" />
              <div className="md:col-span-2">
                <Input name="team_tags" label="Team Tags" placeholder="Galatasaray, Fenerbahçe, Türkiye" />
              </div>
            </div>
            <div>
              <label htmlFor="manual-explanation" className="mb-2 block text-sm font-medium text-text-primary">Açıklama</label>
              <textarea
                id="manual-explanation"
                name="explanation"
                rows={4}
                className="w-full rounded-xl border border-white/[0.08] bg-bg-elevated px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="Doğru cevabın nedenini kısaca açıkla."
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" name="is_active" defaultChecked />
              Doğrudan aktif olarak ekle
            </label>
            <Button type="submit">Soruyu Ekle</Button>
          </form>
        </Card>

        <Card padding="lg" className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">CSV ile İçe Aktar</h2>
            <p className="text-sm text-text-secondary">CSV dosyasındaki soruları toplu olarak ekle. Aynı soru metnine sahip mevcut kayıtlar atlanır.</p>
          </div>
          <form action={importQuestionsFromCsv} className="space-y-4">
            <div>
              <label htmlFor="csv_file" className="mb-2 block text-sm font-medium text-text-primary">CSV Dosyası</label>
              <input
                id="csv_file"
                name="csv_file"
                type="file"
                accept=".csv,text/csv"
                required
                className="w-full rounded-xl border border-white/[0.08] bg-bg-elevated px-4 py-3 text-sm text-text-primary file:mr-3 file:rounded-lg file:border-0 file:bg-primary-500 file:px-3 file:py-2 file:font-semibold file:text-white"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" name="import_active" defaultChecked />
              Geçerli satırları doğrudan aktif ekle
            </label>
            <Button type="submit">CSV&apos;yi İçe Aktar</Button>
          </form>
          <QuestionImportPreview />
          <Card padding="md" variant="elevated" className="space-y-2">
            <p className="text-xs font-semibold text-text-secondary">Desteklenen kolonlar</p>
            <p className="text-xs text-text-secondary">`question_text, option_a, option_b, option_c, option_d, correct_answer, league_scope, league, category, sub_category, difficulty, season_range, team_tags, era_tag, explanation`</p>
            <p className="text-xs text-text-secondary">Alternatif olarak <code>options</code> kolonunda JSON dizi de kullanabilirsin: <code>[&#123;&quot;key&quot;:&quot;A&quot;,&quot;text&quot;:&quot;...&quot;&#125;, ...]</code></p>
            <pre className="overflow-x-auto rounded-lg bg-bg-primary/60 p-3 text-[11px] text-text-secondary">
{`question_text,option_a,option_b,option_c,option_d,correct_answer,league_scope,league,category,sub_category,difficulty,season_range,team_tags,era_tag,explanation
"Türkiye 2002 Dünya Kupası'nı kaçıncı sırada tamamladı?","İkinci","Üçüncü","Dördüncü","Çeyrek finalist","B","world","world_cup","Milli Takım","Dünya Kupası",4,"2002","Türkiye","classic","Türkiye turnuvayı üçüncü sırada tamamladı."`}
            </pre>
          </Card>
        </Card>
      </div>

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
