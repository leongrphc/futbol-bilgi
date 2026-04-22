'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Clock3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AnswerGrid } from '@/components/game/answer-option';
import { TimerBar } from '@/components/game/timer-bar';
import { RewardOverlay } from '@/components/game/reward-overlay';
import { GameResultScreen } from '@/components/game/game-result';
import { ShareButton } from '@/components/social/share-button';
import { useGameStore } from '@/lib/stores/game-store';
import { buildQuestionChallengeShare } from '@/lib/utils/share';
import { trackEvent } from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { useUserStore } from '@/lib/stores/user-store';
import { useTimer } from '@/lib/hooks/use-timer';
import { QUICK_PLAY_CONFIG } from '@/lib/constants/game';
import {
  calculateLevel,
  calculateQuickTimeBonus,
  calculateQuickXP,
  formatNumber,
} from '@/lib/utils/game';
import type { Question } from '@/types';

type QuickPhase = 'loading' | 'playing' | 'revealing' | 'result';

export default function QuickPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedScope = searchParams.get('scope') === 'europe' ? 'europe' : searchParams.get('scope') === 'world' ? 'world' : 'turkey';
  const {
    questionNumber,
    score,
    result,
    xpEarned,
    coinsEarned,
    correctAnswers,
    totalAnswered,
    startGame,
    endGame,
    resetGame,
    setCurrentQuestion,
    nextQuestion,
    answerQuestion,
    applyScoreBonus,
    setTimeRemaining,
  } = useGameStore();

  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [phase, setPhase] = useState<QuickPhase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const [rewardData, setRewardData] = useState<{ xp: number; coins: number; levelUp: { from: number; to: number } | null }>({
    xp: 0,
    coins: 0,
    levelUp: null,
  });

  const pendingRevealRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const currentQuestion = questions[questionNumber - 1] ?? null;

  async function finalizeQuick(gameResult: 'win' | 'timeout', finalScore: number, finalCorrectAnswers: number, finalTotalAnswered: number) {
    const response = await fetch('/api/game/quick', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionIdRef.current,
        result: gameResult,
        score: finalScore,
        correctAnswers: finalCorrectAnswers,
        totalAnswered: finalTotalAnswered,
      }),
    });

    const json = await response.json();
    if (!response.ok || !json.data) {
      return null;
    }

    return json.data;
  }

  function applyPersistedRewards(profile: typeof user, xp: number) {
    if (!user || !profile) {
      setPhase('result');
      return;
    }

    const currentLevel = calculateLevel(user.xp).level;
    const newLevel = calculateLevel(profile.xp).level;
    const levelUp = newLevel > currentLevel ? { from: currentLevel, to: newLevel } : null;

    setUser({
      ...user,
      ...profile,
    });
    setRewardData({
      xp,
      coins: 0,
      levelUp,
    });
    setShowRewardOverlay(true);
  }

  const timer = useTimer({
    initialTime: QUICK_PLAY_CONFIG.total_time,
    autoStart: false,
    onExpire: () => {
      if (phase === 'playing' || phase === 'revealing') {
        void finalizeGame('timeout');
      }
    },
  });

  const finalizeGame = useCallback(async (gameResult: 'win' | 'timeout') => {
    const timeBonus = calculateQuickTimeBonus(timer.timeRemaining);
    const xp = calculateQuickXP(correctAnswers);
    const finalScore = score + timeBonus;

    if (timeBonus > 0) {
      applyScoreBonus(timeBonus);
    }

    trackEvent(ANALYTICS_EVENTS.GAME_COMPLETED, {
      mode: 'quick',
      session_id: sessionIdRef.current,
      result: gameResult,
      score: finalScore,
      correct_answers: correctAnswers,
      total_answered: totalAnswered,
      xp_earned: xp,
      coins_earned: 0,
      time_remaining: timer.timeRemaining,
    });

    const data = await finalizeQuick(gameResult, finalScore, correctAnswers, totalAnswered);
    endGame(gameResult, xp, 0);
    applyPersistedRewards(data?.profile ?? null, xp);
  }, [timer.timeRemaining, correctAnswers, totalAnswered, score, applyPersistedRewards, applyScoreBonus, endGame, setUser, user]);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    const initializeQuick = async () => {
      const response = await fetch(`/api/game/quick?scope=${selectedScope}`, { method: 'POST' });
      const json = await response.json();

      if (!response.ok || !json.data) {
        return;
      }

      const gameQuestions = (json.data.questions ?? []) as Question[];
      setQuestions(gameQuestions);

      const sessionId = json.data.sessionId as string;
      sessionIdRef.current = sessionId;
      resetGame();
      startGame('quick', selectedScope, sessionId);
      trackEvent(ANALYTICS_EVENTS.GAME_STARTED, {
        mode: 'quick',
        session_id: sessionId,
        league_scope: selectedScope,
        question_count: QUICK_PLAY_CONFIG.total_questions,
      });

      if (gameQuestions.length > 0) {
        setCurrentQuestion(gameQuestions[0]);
        setPhase('playing');
        timer.reset(QUICK_PLAY_CONFIG.total_time);
        timer.start();
      }
    };

    void initializeQuick();

    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, [resetGame, selectedScope, setCurrentQuestion, startGame, timer, timer.reset, timer.start]);

  useEffect(() => {
    setTimeRemaining(timer.timeRemaining);
  }, [setTimeRemaining, timer.timeRemaining]);

  const handleSelectAnswer = useCallback((answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion || phase !== 'playing' || pendingRevealRef.current) return;

    pendingRevealRef.current = true;
    const isCorrect = answer === currentQuestion.correct_answer;
    const points = isCorrect ? QUICK_PLAY_CONFIG.points_per_correct : 0;

    setSelectedAnswer(answer);
    setCorrectAnswer(currentQuestion.correct_answer);
    setPhase('revealing');

    answerQuestion(isCorrect, points);

    revealTimeoutRef.current = setTimeout(() => {
      pendingRevealRef.current = false;

      if (questionNumber >= QUICK_PLAY_CONFIG.total_questions) {
        void finalizeGame('win');
        return;
      }

      nextQuestion();
      const nextQ = questions[questionNumber];
      if (nextQ) {
        setCurrentQuestion(nextQ);
      }
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setPhase('playing');
    }, 1500);
  }, [currentQuestion, phase, answerQuestion, questionNumber, finalizeGame, nextQuestion, questions, setCurrentQuestion]);

  const handleRewardComplete = useCallback(() => {
    setShowRewardOverlay(false);
    setPhase('result');
  }, []);

  const handlePlayAgain = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleGoHome = useCallback(() => {
    resetGame();
    router.push('/');
  }, [resetGame, router]);

  if (showRewardOverlay) {
    return (
      <RewardOverlay
        isVisible={true}
        xp={rewardData.xp}
        coins={rewardData.coins}
        levelUp={rewardData.levelUp}
        onComplete={handleRewardComplete}
      />
    );
  }

  if (phase === 'result') {
    return (
      <GameResultScreen
        mode="quick"
        result={result ?? 'win'}
        score={score}
        correctAnswers={correctAnswers}
        totalAnswered={totalAnswered}
        xpEarned={xpEarned}
        coinsEarned={coinsEarned}
        questionReached={questionNumber}
        totalQuestions={QUICK_PLAY_CONFIG.total_questions}
        safePointScore={0}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 pb-24">
        <Card padding="lg" className="w-full max-w-sm text-center">
          <Zap className="mx-auto mb-4 h-16 w-16 text-blue-500" />
          <p className="text-text-secondary">Sorular yükleniyor...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="mx-auto max-w-xl space-y-4">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <Card padding="md">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Hızlı Maç</p>
                <p className="font-display text-xl font-bold text-text-primary">
                  {questionNumber}/{QUICK_PLAY_CONFIG.total_questions}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Skor</p>
                <p className="font-display text-xl font-bold text-primary-500">{formatNumber(score)}</p>
              </div>
            </div>
            <TimerBar
              timeRemaining={timer.timeRemaining}
              totalTime={QUICK_PLAY_CONFIG.total_time}
              isRunning={timer.isRunning}
              isExpired={timer.isExpired}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
              <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> Her doğru +100</span>
              <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Süre bonusu sonda</span>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card padding="lg">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
                {currentQuestion.category}
              </span>
              <span className="text-xs text-text-muted">{currentQuestion.difficulty}. seviye</span>
            </div>
            <h1 className="font-display text-xl font-bold leading-snug text-text-primary">
              {currentQuestion.question_text}
            </h1>
            <div className="mt-4">
              <ShareButton
                payload={buildQuestionChallengeShare({
                  category: currentQuestion.category,
                  questionText: currentQuestion.question_text,
                })}
                label="Bu Soruyu Paylaş"
                variant="outline"
                size="sm"
                fullWidth
              />
            </div>
          </Card>
        </motion.div>

        <AnswerGrid
          options={currentQuestion.options}
          selectedAnswer={selectedAnswer}
          correctAnswer={correctAnswer}
          eliminatedOptions={[]}
          disabled={phase !== 'playing'}
          onSelect={handleSelectAnswer}
        />

        <AnimatePresence>
          {phase === 'revealing' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card padding="md" className="border-primary-500/20 bg-primary-500/5">
                <p className="text-sm text-text-secondary">
                  {selectedAnswer === currentQuestion.correct_answer ? 'Doğru cevap! +100 puan' : 'Yanlış cevap. Sıradaki soruya geçiliyor...'}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
