'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginAction } from './actions';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (formData: FormData): boolean => {
    const errors: { email?: string; password?: string } = {};
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email) {
      errors.email = 'E-posta adresi gereklidir';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (!password) {
      errors.password = 'Şifre gereklidir';
    } else if (password.length < 6) {
      errors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (formData: FormData) => {
    setError('');
    setFormErrors({});

    if (!validateForm(formData)) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-text-primary">
          Giriş Yap
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Hesabına giriş yaparak devam et
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 flex items-start gap-2 rounded-xl bg-danger/10 border border-danger/20 p-3"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-danger" />
          <p className="text-sm text-danger">{error}</p>
        </motion.div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <Input
          type="email"
          name="email"
          label="E-posta"
          placeholder="ornek@email.com"
          icon={<Mail className="h-5 w-5" />}
          error={formErrors.email}
          disabled={isLoading}
          autoComplete="email"
          required
        />

        <Input
          type="password"
          name="password"
          label="Şifre"
          placeholder="••••••••"
          icon={<Lock className="h-5 w-5" />}
          error={formErrors.password}
          disabled={isLoading}
          autoComplete="current-password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          className="mt-6"
        >
          Giriş Yap
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary">
          Hesabın yok mu?{' '}
          <Link
            href="/register"
            className="font-semibold text-primary-500 hover:text-primary-400 transition-colors"
          >
            Kayıt Ol
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
