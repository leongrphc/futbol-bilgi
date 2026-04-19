'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { trackEvent } from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

export default function DailyPage() {
  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.DAILY_MODE_VIEWED, {
      status: 'coming_soon',
    });
  }, []);

  return (
    <div className="min-h-screen p-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh]"
      >
        <Card padding="lg" className="text-center max-w-sm">
          <Calendar className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
            Günlük Meydan Okuma
          </h1>
          <p className="text-text-secondary">
            Oyun modu yakında gelecek!
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
