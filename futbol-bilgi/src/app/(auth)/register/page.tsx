'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registerAction } from './actions';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (formData: FormData): boolean => {
    const errors: {
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Username validation
    if (!username) {
      errors.username = 'Kullanıcı adı gereklidir';
    } else if (username.length < 3) {
      errors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
    } else if (username.length > 30) {
      errors.username = 'Kullanıcı adı en fazla 30 karakter olabilir';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir';
    }

    // Email validation
    if (!email) {
      errors.email = 'E-posta adresi gereklidir';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    // Password validation
    if (!password) {
      errors.password = 'Şifre gereklidir';
    } else if (password.length < 6) {
      errors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Şifreler eşleşmiyor';
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
      const result = await registerAction(formData);
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
          Kayıt Ol
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Yeni hesap oluştur ve yarışmaya başla
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
          type="text"
          name="username"
          label="Kullanıcı Adı"
          placeholder="kullanici_adi"
          icon={<User className="h-5 w-5" />}
          error={formErrors.username}
          disabled={isLoading}
          autoComplete="username"
          required
        />

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
          autoComplete="new-password"
          required
        />

        <Input
          type="password"
          name="confirmPassword"
          label="Şifre Tekrar"
          placeholder="••••••••"
          icon={<Lock className="h-5 w-5" />}
          error={formErrors.confirmPassword}
          disabled={isLoading}
          autoComplete="new-password"
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
          Kayıt Ol
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary">
          Zaten hesabın var mı?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary-500 hover:text-primary-400 transition-colors"
          >
            Giriş Yap
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
