'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Calendar, Gift, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnswerGrid } from '@/components/game/answer-option';
import { RewardOverlay } from '@/components/game/reward-overlay';
import { GameResultScreen } from '@/components/game/game-result';
import { ShareButton } from '@/components/social/share-button';
import { TimerBar } from '@/components/game/timer-bar';
import { useGameStore } from '@/lib/stores/game-store';
import { buildQuestionChallengeShare } from '@/lib/utils/share';
import { trackEvent } from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { useUserStore } from '@/lib/stores/user-store';
import { useTimer } from '@/lib/hooks/use-timer';
import { DAILY_CHALLENGE_CONFIG } from '@/lib/constants/game';
import { calculateLevel, formatNumber } from '@/lib/utils/game';
import { getDailyChallengeQuestions } from '@/lib/data/mock-questions';
import type { Question } from '@/types';

type DailyPhase = 'loading' | 'playing' | 'revealing' | 'result';

const DAILY_TIME_LIMIT = 75;
const DAILY_POINTS_PER_CORRECT = 150;

export default function DailyPage() {
  const router = useRouter();
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
    setTimeRemaining,
  } = useGameStore();

  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [phase, setPhase] = useState<DailyPhase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [rewardData, setRewardData] = useState<{ xp: number; coins: number; levelUp: { from: number; to: number } | null }>({
    xp: 0,
    coins: 0,
    levelUp: null,
  });

  const pendingRevealRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const isFinishingRef = useRef(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const currentQuestion = questions[questionNumber - 1] ?? null;

  const timer = useTimer({
    initialTime: DAILY_TIME_LIMIT,
    autoStart: false,
    onExpire: () => {
      if (phase === 'playing' || phase === 'revealing') {
        void finalizeGame('timeout');
      }
    },
  });

  async function finalizeDaily(gameResult: 'win' | 'timeout', finalScore: number, finalCorrectAnswers: number, finalTotalAnswered: number) {
    const response = await fetch('/api/game/daily', {
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
      setMessage(json.error || 'Günlük meydan okuma tamamlanamadı.');
      return null;
    }

    return json.data;
  }

  const applyPersistedRewards = useCallback((profile: typeof user, xp: number, coins: number) => {
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
      coins,
      levelUp,
    });
    setShowRewardOverlay(true);
  }, [setUser, user]);

  const finalizeGame = useCallback(async (gameResult: 'win' | 'timeout') => {
    if (isFinishingRef.current) {
      return;
    }

    isFinishingRef.current = true;
    pendingRevealRef.current = false;
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    const xp = DAILY_CHALLENGE_CONFIG.base_xp;
    const coins = DAILY_CHALLENGE_CONFIG.base_coins;

    trackEvent(ANALYTICS_EVENTS.GAME_COMPLETED, {
      mode: 'daily',
      session_id: sessionIdRef.current,
      result: gameResult,
      score,
      correct_answers: correctAnswers,
      total_answered: totalAnswered,
      xp_earned: xp,
      coins_earned: coins,
      time_remaining: timer.timeRemaining,
    });

    const data = await finalizeDaily(gameResult, score, correctAnswers, totalAnswered);
    if (!data) {
      endGame(gameResult, xp, coins);
      setPhase('result');
      return;
    }

    endGame(gameResult, xp, coins);
    applyPersistedRewards(data.profile, xp, coins);
  }, [applyPersistedRewards, correctAnswers, endGame, score, timer.timeRemaining, totalAnswered]);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.DAILY_MODE_VIEWED, {
      status: 'available',
    });
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    const initializeDaily = async () => {
      const response = await fetch('/api/game/daily', { method: 'POST' });
      const json = await response.json();

      if (!response.ok || !json.data) {
        setMessage(json.error || 'Günlük meydan okuma şu anda başlatılamıyor.');
        setPhase('result');
        return;
      }

      const gameQuestions = getDailyChallengeQuestions();
      setQuestions(gameQuestions);

      const sessionId = json.data.sessionId as string;
      sessionIdRef.current = sessionId;
      isFinishingRef.current = false;
      setHasSession(true);
      resetGame();
      startGame('daily', 'turkey', sessionId);
      trackEvent(ANALYTICS_EVENTS.GAME_STARTED, {
        mode: 'daily',
        session_id: sessionId,
        league_scope: 'turkey',
        question_count: DAILY_CHALLENGE_CONFIG.questions,
      });

      if (gameQuestions.length > 0) {
        setCurrentQuestion(gameQuestions[0]);
        setPhase('playing');
        timer.reset(DAILY_TIME_LIMIT);
        timer.start();
      }
    };

    void initializeDaily();

    return () => {
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, [resetGame, setCurrentQuestion, startGame, timer]);

  useEffect(() => {
    setTimeRemaining(timer.timeRemaining);
  }, [setTimeRemaining, timer.timeRemaining]);

  const handleSelectAnswer = useCallback((answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion || phase !== 'playing' || pendingRevealRef.current) return;

    pendingRevealRef.current = true;
    const isCorrect = answer === currentQuestion.correct_answer;
    const points = isCorrect ? DAILY_POINTS_PER_CORRECT : 0;

    setSelectedAnswer(answer);
    setCorrectAnswer(currentQuestion.correct_answer);
    setPhase('revealing');
    answerQuestion(isCorrect, points);

    revealTimeoutRef.current = setTimeout(() => {
      pendingRevealRef.current = false;

      if (questionNumber >= DAILY_CHALLENGE_CONFIG.questions) {
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
  }, [answerQuestion, currentQuestion, finalizeGame, nextQuestion, phase, questionNumber, questions, setCurrentQuestion]);

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
      <div className="min-h-screen p-4 pb-24">
        {message && !hasSession ? (
          <div className="mx-auto mb-4 max-w-xl">
            <Card padding="md" className="text-sm text-text-secondary">
              {message}
            </Card>
          </div>
        ) : null}
        {hasSession ? (
          <GameResultScreen
            mode="daily"
            result={result ?? 'timeout'}
            score={score}
            correctAnswers={correctAnswers}
            totalAnswered={totalAnswered}
            xpEarned={xpEarned}
            coinsEarned={coinsEarned}
            questionReached={Math.min(questionNumber, DAILY_CHALLENGE_CONFIG.questions)}
            totalQuestions={DAILY_CHALLENGE_CONFIG.questions}
            safePointScore={result === 'timeout' ? 0 : score}
            onPlayAgain={handlePlayAgain}
            onGoHome={handleGoHome}
          />
        ) : (
          <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
            <Card padding="lg" className="w-full max-w-md text-center">
              <Calendar className="mx-auto mb-4 h-14 w-14 text-primary-500" />
              <h1 className="mb-2 font-display text-2xl font-bold text-text-primary">Günlük Meydan Okuma</h1>
              <p className="text-text-secondary">{message ?? 'Bugünkü meydan okumayı zaten başlattın. Yarın tekrar dene.'}</p>
              <div className="mt-4">
                <Button onClick={handleGoHome} fullWidth>
                  Ana Sayfaya Dön
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 pb-24">
        <Card padding="lg" className="w-full max-w-sm text-center">
          <Calendar className="mx-auto mb-4 h-16 w-16 text-primary-500" />
          <p className="text-text-secondary">Günlük sorular hazırlanıyor...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="mx-auto max-w-xl space-y-4">
        {message ? (
          <Card padding="md" className="text-sm text-text-secondary">
            {message}
          </Card>
        ) : null}

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <Card padding="md">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Günlük Meydan Okuma</p>
                <p className="font-display text-xl font-bold text-text-primary">
                  {questionNumber}/{DAILY_CHALLENGE_CONFIG.questions}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Skor</p>
                <p className="font-display text-xl font-bold text-primary-500">{formatNumber(score)}</p>
              </div>
            </div>
            <TimerBar
              timeRemaining={timer.timeRemaining}
              totalTime={DAILY_TIME_LIMIT}
              isRunning={timer.isRunning}
              isExpired={timer.isExpired}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
              <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Her doğru +{DAILY_POINTS_PER_CORRECT}</span>
              <span className="flex items-center gap-1"><Gift className="h-3.5 w-3.5" /> +{DAILY_CHALLENGE_CONFIG.base_xp} XP / +{DAILY_CHALLENGE_CONFIG.base_coins} coin</span>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card padding="lg">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-500">
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
                  {selectedAnswer === currentQuestion.correct_answer
                    ? `Doğru cevap! +${DAILY_POINTS_PER_CORRECT} puan`
                    : 'Yanlış cevap. Sonraki soruya geçiliyor...'}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
