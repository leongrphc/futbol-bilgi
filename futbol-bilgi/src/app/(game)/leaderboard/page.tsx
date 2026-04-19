'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen p-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <Card padding="lg" className="text-center max-w-sm">
          <Trophy className="h-16 w-16 text-secondary-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
            Sıralama
          </h1>
          <p className="text-text-secondary">
            Liderlik tablosu yakında gelecek!
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
