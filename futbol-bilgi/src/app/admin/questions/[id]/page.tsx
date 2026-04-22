import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { redirect } from 'next/navigation';
import type { QuestionAdmin } from '@/lib/admin/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { CATEGORIES, SUBCATEGORY_LABELS, getCategoryName } from '@/lib/constants/categories';

async function getQuestion(id: string): Promise<QuestionAdmin> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('questions').select('*').eq('id', id).single();

  if (error) {
    throw new Error(error.message);
  }

  return data as QuestionAdmin;
}

function parseTeamTags(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const LEAGUE_OPTIONS = Object.entries(CATEGORIES).flatMap(([scope, categories]) =>
  Object.keys(categories).map((key) => ({
    value: key,
    label: `${scope === 'turkey' ? 'Türkiye' : scope === 'europe' ? 'Avrupa' : 'Dünya'} · ${getCategoryName(scope, key)}`,
  })),
);

const CATEGORY_OPTIONS = [
  { value: 'Tarih', label: 'Tarih' },
  { value: 'İstatistik', label: 'İstatistik' },
  { value: 'Teknik Direktörler', label: 'Teknik Direktörler' },
  { value: 'Milli Takım', label: 'Milli Takım' },
  { value: 'Avrupa', label: 'Avrupa' },
  { value: 'Rekorlar', label: 'Rekorlar' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Kupalar', label: 'Kupalar' },
] as const;

const SUBCATEGORY_OPTIONS = Object.entries(SUBCATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const ERA_OPTIONS = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Klasik' },
  { value: 'legendary', label: 'Efsane' },
] as const;

export default async function AdminQuestionEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const question = await getQuestion(id);

  if (!question) {
    return <Card padding="lg">Soru bulunamadı.</Card>;
  }

  return (
    <div className="space-y-4">
      <Card padding="lg" className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Taslak / Soru Düzenle</h2>
        <p className="text-sm text-text-secondary">Yayın checklist&apos;ini tamamlamak için soru metnini, açıklamayı ve metadata alanlarını birlikte düzenle.</p>
      </Card>

      <Card padding="lg">
        <form
          action={async (formData) => {
            'use server';
            await requireAdmin();

            const questionText = String(formData.get('question_text') || '').trim();
            const explanation = String(formData.get('explanation') || '').trim();
            const seasonRange = String(formData.get('season_range') || '').trim();
            const teamTags = parseTeamTags(String(formData.get('team_tags') || ''));
            const category = String(formData.get('category') || '').trim();
            const subCategory = String(formData.get('sub_category') || '').trim();
            const league = String(formData.get('league') || '').trim();
            const eraTag = String(formData.get('era_tag') || '').trim();
            const rawCorrectAnswer = String(formData.get('correct_answer') || question.correct_answer).trim().toUpperCase();
            const isActive = formData.get('is_active') === 'on';

            if (!questionText) {
              throw new Error('Soru metni boş bırakılamaz.');
            }

            if (!['A', 'B', 'C', 'D'].includes(rawCorrectAnswer)) {
              throw new Error('Doğru cevap yalnızca A, B, C veya D olabilir.');
            }

            const correctAnswer = rawCorrectAnswer as 'A' | 'B' | 'C' | 'D';

            const supabase = createAdminClient();
            const { error } = await supabase
              .from('questions')
              .update({
                question_text: questionText,
                explanation: explanation || null,
                season_range: seasonRange || null,
                team_tags: teamTags,
                league: league || question.league,
                category: category || question.category,
                sub_category: subCategory || null,
                era_tag: eraTag || null,
                correct_answer: correctAnswer,
                is_active: isActive,
                updated_at: new Date().toISOString(),
              })
              .eq('id', question.id);

            if (error) {
              throw new Error(error.message);
            }
            revalidatePath('/admin/questions');
            revalidatePath(`/admin/questions/${question.id}`);
            redirect(`/admin/questions/${question.id}`);
          }}
          className="space-y-4"
        >
          <Input label="Soru Metni" name="question_text" defaultValue={question.question_text} required />
          <Input label="Açıklama" name="explanation" defaultValue={question.explanation || ''} />
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Kategori" name="category" defaultValue={question.category} options={[...CATEGORY_OPTIONS]} placeholder="Kategori seç" />
            <Select label="Alt Kategori" name="sub_category" defaultValue={question.sub_category || ''} options={SUBCATEGORY_OPTIONS} placeholder="Alt kategori seç" />
            <Input label="Sezon Aralığı" name="season_range" defaultValue={question.season_range || ''} placeholder="Örn: 2018-2024" />
            <Input label="Team Tags" name="team_tags" defaultValue={question.team_tags.join(', ')} placeholder="Örn: Galatasaray, Fenerbahçe" />
            <Input label="Doğru Cevap" name="correct_answer" defaultValue={question.correct_answer} placeholder="A / B / C / D" maxLength={1} pattern="[ABCDabcd]" />
            <Select label="Lig Kodu" name="league" defaultValue={question.league} options={LEAGUE_OPTIONS} placeholder="Lig seç" />
            <Select label="Dönem Etiketi" name="era_tag" defaultValue={question.era_tag || ''} options={[...ERA_OPTIONS]} placeholder="Dönem seç" />
          </div>

          <Card padding="md" variant="elevated" className="space-y-2">
            <p className="text-xs font-semibold text-text-secondary">Mevcut seçenekler</p>
            <ul className="space-y-1 text-sm text-text-secondary">
              {question.options.map((option) => (
                <li key={option.key}>{option.key}) {option.text}</li>
              ))}
            </ul>
          </Card>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={question.is_active} />
            Aktif
          </label>
          <Button type="submit">Kaydet</Button>
        </form>
      </Card>
    </div>
  );
}
