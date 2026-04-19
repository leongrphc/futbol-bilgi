'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function registerAction(formData: FormData) {
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!username || !email || !password) {
    return { error: 'Tüm alanları doldurunuz' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Bu e-posta adresi zaten kullanılıyor' };
    }
    return { error: 'Kayıt başarısız. Lütfen tekrar deneyin.' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
