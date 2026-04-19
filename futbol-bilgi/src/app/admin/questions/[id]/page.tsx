import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { redirect } from 'next/navigation';
import type { QuestionAdmin } from '@/lib/admin/types';
import { createAdminClient } from '@/lib/supabase/admin';

async function getQuestion(id: string): Promise<QuestionAdmin> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('questions').select('*').eq('id', id).single();

  if (error) {
    throw new Error(error.message);
  }

  return data as QuestionAdmin;
}

export default async function AdminQuestionEdit({ params }: { params: { id: string } }) {
  await requireAdmin();
  const question = await getQuestion(params.id);

  if (!question) {
    return <Card padding="lg">Soru bulunamadı.</Card>;
  }

  return (
    <Card padding="lg">
      <h2 className="font-display text-lg font-semibold mb-4">Soru Düzenle</h2>
      <form
        action={async (formData) => {
          'use server';
          await requireAdmin();
          const payload = {
            id: question.id,
            question_text: String(formData.get('question_text') || ''),
            explanation: String(formData.get('explanation') || ''),
            is_active: formData.get('is_active') === 'on',
          };
          const supabase = createAdminClient();
          const { error } = await supabase
            .from('questions')
            .update({ ...payload, updated_at: new Date().toISOString() })
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
        <Input label="Soru Metni" name="question_text" defaultValue={question.question_text} />
        <Input label="Açıklama" name="explanation" defaultValue={question.explanation || ''} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={question.is_active} />
          Aktif
        </label>
        <Button type="submit">Kaydet</Button>
      </form>
    </Card>
  );
}
