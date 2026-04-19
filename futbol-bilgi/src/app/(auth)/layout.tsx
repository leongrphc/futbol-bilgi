'use client';

import { motion } from 'framer-motion';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-bg-primary">
      {/* Animated gradient background */}
      <div className="gradient-field fixed inset-0" />

      {/* Decorative elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-secondary-500/10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo & Title */}
          <div className="mb-8 text-center">
            <motion.div
              className="mb-3 text-6xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
            >
              ⚽
            </motion.div>
            <h1 className="font-display text-3xl font-bold text-text-primary">
              FutbolBilgi
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Türkiye Ligleri Bilgi Yarışması
            </p>
          </div>

          {/* Auth Card */}
          <div className="glass-card p-6">{children}</div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-text-muted">
            © 2026 FutbolBilgi. Tüm hakları saklıdır.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
