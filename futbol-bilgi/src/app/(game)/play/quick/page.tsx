'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Zap, Clock3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AnswerGrid } from '@/components/game/answer-option';
import { TimerBar } from '@/components/game/timer-bar';
import { RewardOverlay } from '@/components/game/reward-overlay';
import { GameResultScreen } from '@/components/game/game-result';
import { ShareButton } from '@/components/social/share-button';
import { useGameStore } from '@/lib/stores/game-store';
import { buildQuestionChallengeShare } from '@/lib/utils/share';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useUserStore } from '@/lib/stores/user-store';
import { useTimer } from '@/lib/hooks/use-timer';
import { QUICK_PLAY_CONFIG } from '@/lib/constants/game';
import {
  calculateLevel,
  calculateQuickTimeBonus,
  calculateQuickXP,
  formatNumber,
} from '@/lib/utils/game';
import { getQuickPlayQuestions } from '@/lib/data/mock-questions';
import type { Question } from '@/types';

type QuickPhase = 'loading' | 'playing' | 'revealing' | 'result';

export default function QuickPage() {
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
    applyScoreBonus,
    setTimeRemaining,
  } = useGameStore();

  const user = useUserStore((state) => state.user);
  const addXP = useUserStore((state) => state.addXP);
  const incrementQuestionsAnswered = useUserStore((state) => state.incrementQuestionsAnswered);

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
  const currentQuestion = questions[questionNumber - 1] ?? null;

  const timer = useTimer({
    initialTime: QUICK_PLAY_CONFIG.total_time,
    autoStart: false,
    onTick: (remaining) => {
      setTimeRemaining(remaining);
    },
    onExpire: () => {
      if (phase === 'playing' || phase === 'revealing') {
        finalizeGame('timeout');
      }
    },
  });

  const finalizeGame = useCallback((gameResult: 'win' | 'timeout') => {
    const timeBonus = calculateQuickTimeBonus(timer.timeRemaining);
    const xp = calculateQuickXP(correctAnswers);

    if (timeBonus > 0) {
      applyScoreBonus(timeBonus);
    }

    if (!user) {
      endGame(gameResult, xp, 0);
      setPhase('result');
      return;
    }

    const currentLevel = calculateLevel(user.xp).level;
    const newLevel = calculateLevel(user.xp + xp).level;

    addXP(xp);
    endGame(gameResult, xp, 0);
    setRewardData({
      xp,
      coins: 0,
      levelUp: newLevel > currentLevel ? { from: currentLevel, to: newLevel } : null,
    });
    setShowRewardOverlay(true);
  }, [timer.timeRemaining, correctAnswers, applyScoreBonus, user, endGame, addXP]);

  useEffect(() => {
    const gameQuestions = getQuickPlayQuestions();
    setQuestions(gameQuestions);

    const sessionId = `quick_${Date.now()}`;
    resetGame();
    startGame('quick', 'turkey', sessionId);

    if (gameQuestions.length > 0) {
      setCurrentQuestion(gameQuestions[0]);
      setPhase('playing');
      timer.reset(QUICK_PLAY_CONFIG.total_time);
      setTimeRemaining(QUICK_PLAY_CONFIG.total_time);
      timer.start();
    }
  }, [resetGame, startGame, setCurrentQuestion, timer, setTimeRemaining]);

  const handleSelectAnswer = useCallback((answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion || phase !== 'playing' || pendingRevealRef.current) return;

    pendingRevealRef.current = true;
    const isCorrect = answer === currentQuestion.correct_answer;
    const points = isCorrect ? QUICK_PLAY_CONFIG.points_per_correct : 0;

    setSelectedAnswer(answer);
    setCorrectAnswer(currentQuestion.correct_answer);
    setPhase('revealing');

    answerQuestion(isCorrect, points);
    incrementQuestionsAnswered(isCorrect);

    const timeout = setTimeout(() => {
      pendingRevealRef.current = false;

      if (questionNumber >= QUICK_PLAY_CONFIG.total_questions) {
        finalizeGame('win');
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
    }, 900);

    return () => clearTimeout(timeout);
  }, [currentQuestion, phase, answerQuestion, incrementQuestionsAnswered, questionNumber, finalizeGame, nextQuestion, questions, setCurrentQuestion]);

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
        <Card padding="lg" className="text-center max-w-sm w-full">
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
