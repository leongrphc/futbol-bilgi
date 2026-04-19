'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/lib/stores/user-store';

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);

  return (
    <div className="min-h-screen p-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <Card padding="lg" className="text-center max-w-sm">
          <User className="h-16 w-16 text-primary-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
            {user?.username || 'Profil'}
          </h1>
          <p className="text-text-secondary">
            Profil sayfası yakında gelecek!
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
