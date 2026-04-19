'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/stores/game-store';
import { useUserStore } from '@/lib/stores/user-store';
import { useTimer } from '@/lib/hooks/use-timer';
import { MILLIONAIRE_STEPS, ENERGY_CONFIG } from '@/lib/constants/game';
import {
  calculateXP,
  calculateCoins,
  calculateLevel,
  getSafePointScore,
  formatNumber,
  getMillionaireStep,
} from '@/lib/utils/game';
import { getMillionaireQuestions } from '@/lib/data/mock-questions';

import { TimerBar } from '@/components/game/timer-bar';
import { AnswerGrid } from '@/components/game/answer-option';
import { JokerBar, AudienceResult, PhoneResult } from '@/components/game/joker-bar';
import { PrizeLadder, MiniPrize } from '@/components/game/prize-ladder';
import { GameResultScreen } from '@/components/game/game-result';
import { RewardOverlay, EnergyWarning } from '@/components/game/reward-overlay';

import type { Question, JokerType } from '@/types';

// ==========================================
// Game Phase — tracks the current UI state
// ==========================================

type GamePhase =
  | 'loading'      // Fetching questions
  | 'playing'      // Active gameplay
  | 'answered'     // Answer selected, waiting for reveal
  | 'revealing'    // Showing correct/wrong animation
  | 'transitioning'// Moving to next question
  | 'result';      // Game over screen

// ==========================================
// Millionaire Game Page
// ==========================================

export default function MillionairePage() {
  const router = useRouter();

  // Game store
  const {
    questionNumber,
    score,
    jokers,
    isGameOver,
    result,
    safePointReached,
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
    useJoker,
    updateSafePoint,
  } = useGameStore();

  // User store — economy integration
  const user = useUserStore((s) => s.user);
  const addXP = useUserStore((s) => s.addXP);
  const updateCoins = useUserStore((s) => s.updateCoins);
  const updateEnergy = useUserStore((s) => s.updateEnergy);
  const incrementQuestionsAnswered = useUserStore((s) => s.incrementQuestionsAnswered);

  // Local state
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<('A' | 'B' | 'C' | 'D')[]>([]);
  const [showPrizeLadder, setShowPrizeLadder] = useState(false);
  const [audienceResult, setAudienceResult] = useState<Record<'A' | 'B' | 'C' | 'D', number> | null>(null);
  const [phoneResult, setPhoneResult] = useState<{ suggestion: 'A' | 'B' | 'C' | 'D'; confidence: number } | null>(null);
  const [doubleAnswerActive, setDoubleAnswerActive] = useState(false);
  const [firstWrongAnswer, setFirstWrongAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  // Economy UI state
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const [showEnergyWarning, setShowEnergyWarning] = useState(false);
  const [pendingRewards, setPendingRewards] = useState<{ xp: number; coins: number; levelUp: { from: number; to: number } | null }>({ xp: 0, coins: 0, levelUp: null });
  const [energyChecked, setEnergyChecked] = useState(false);

  // Current question derived from state
  const currentQuestion = questions[questionNumber - 1] ?? null;
  const currentStep = getMillionaireStep(questionNumber);
  const safePointScore = getSafePointScore(questionNumber);
  const phaseRef = useRef(phase);
  const safePointReachedRef = useRef(safePointReached);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    safePointReachedRef.current = safePointReached;
  }, [safePointReached]);

  // Timer
  const timer = useTimer({
    initialTime: currentStep?.timeLimit ?? 30,
    autoStart: false,
    onExpire: () => {
      if (phaseRef.current === 'playing') {
        const finalScore = safePointReachedRef.current;
        const xp = calculateXP(finalScore, 'millionaire');
        const coins = calculateCoins(finalScore, 'millionaire');
        endGame('timeout', xp, coins);
        awardRewards(xp, coins);
      }
    },
  });

  // ==========================================
  // Initialize Game — with energy check
  // ==========================================

  const initializeGame = useCallback(() => {
    const gameQuestions = getMillionaireQuestions();
    setQuestions(gameQuestions);

    const sessionId = `session_${Date.now()}`;
    resetGame();
    startGame('millionaire', 'turkey', sessionId);

    // Deduct energy
    if (user) {
      updateEnergy(-ENERGY_CONFIG.cost_millionaire);
    }

    if (gameQuestions.length > 0) {
      setCurrentQuestion(gameQuestions[0]);
      setPhase('playing');

      setTimeout(() => {
        timer.reset(MILLIONAIRE_STEPS[0].timeLimit);
        timer.start();
      }, 500);
    }
  }, [resetGame, startGame, setCurrentQuestion, timer, user, updateEnergy]);

  useEffect(() => {
    // Check energy before starting
    if (!energyChecked) {
      setEnergyChecked(true);
      const currentEnergy = user?.energy ?? 0;

      if (currentEnergy < ENERGY_CONFIG.cost_millionaire) {
        // Not enough energy — show warning
        setShowEnergyWarning(true);
        return;
      }

      // Enough energy — start directly
      initializeGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [energyChecked]);

  // ==========================================
  // Handle Answer Selection
  // ==========================================

  const handleSelectAnswer = useCallback(
    (key: 'A' | 'B' | 'C' | 'D') => {
      if (phase !== 'playing' || !currentQuestion) return;

      // Double answer mode — first wrong guess
      if (doubleAnswerActive && firstWrongAnswer === null && key !== currentQuestion.correct_answer) {
        setFirstWrongAnswer(key);
        setSelectedAnswer(null);
        setEliminatedOptions((prev) => [...prev, key]);
        return;
      }

      setSelectedAnswer(key);
      setPhase('answered');
      timer.pause();

      // Reveal answer after a short delay
      setTimeout(() => {
        revealAnswer(key);
      }, 1000);
    },
    [phase, currentQuestion, doubleAnswerActive, firstWrongAnswer, timer],
  );

  // ==========================================
  // Reveal Answer
  // ==========================================

  const revealAnswer = useCallback(
    (selected: 'A' | 'B' | 'C' | 'D') => {
      if (!currentQuestion || !currentStep) return;

      setCorrectAnswer(currentQuestion.correct_answer);
      setPhase('revealing');

      const isCorrect = selected === currentQuestion.correct_answer;

      // Record answer in game store
      answerQuestion(isCorrect, isCorrect ? currentStep.points : 0);

      // Record answer in user store (persistent stats)
      if (user) {
        incrementQuestionsAnswered(isCorrect);
      }

      // Update safe point if at a safe point
      if (isCorrect && currentStep.isSafePoint) {
        updateSafePoint(currentStep.points);
      }

      setTimeout(() => {
        if (isCorrect) {
          handleCorrectAnswer();
        } else {
          handleWrongAnswer();
        }
      }, 2000);
    },
    [currentQuestion, currentStep, answerQuestion, updateSafePoint],
  );

  // ==========================================
  // Award Rewards to User Store
  // ==========================================

  const awardRewards = useCallback((xp: number, coins: number) => {
    if (!user) {
      setPhase('result');
      return;
    }

    const currentLevel = calculateLevel(user.xp).level;
    const newLevel = calculateLevel(user.xp + xp).level;
    const levelUp = newLevel > currentLevel ? { from: currentLevel, to: newLevel } : null;

    addXP(xp);
    updateCoins(coins);
    setPendingRewards({ xp, coins, levelUp });
    setShowRewardOverlay(true);
  }, [user, addXP, updateCoins]);

  // ==========================================
  // Correct Answer Flow
  // ==========================================

  const handleCorrectAnswer = useCallback(() => {
    // Check if this was the last question (WIN!)
    if (questionNumber >= 15) {
      const xp = calculateXP(1000000, 'millionaire');
      const coins = calculateCoins(1000000, 'millionaire');
      endGame('win', xp, coins);
      awardRewards(xp, coins);
      return;
    }

    // Transition to next question
    setPhase('transitioning');

    setTimeout(() => {
      nextQuestion();
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setEliminatedOptions([]);
      setAudienceResult(null);
      setPhoneResult(null);
      setDoubleAnswerActive(false);
      setFirstWrongAnswer(null);

      const nextQ = questions[questionNumber]; // questionNumber is 0-indexed here since nextQuestion increments it
      if (nextQ) {
        setCurrentQuestion(nextQ);
        const nextStep = getMillionaireStep(questionNumber + 1);
        timer.reset(nextStep?.timeLimit ?? 30);
        timer.start();
        setPhase('playing');
      }
    }, 1000);
  }, [questionNumber, questions, nextQuestion, setCurrentQuestion, endGame, timer]);

  // ==========================================
  // Wrong Answer Flow
  // ==========================================

  const handleWrongAnswer = useCallback(() => {
    const finalScore = safePointReached;
    const xp = calculateXP(finalScore, 'millionaire');
    const coins = calculateCoins(finalScore, 'millionaire');
    endGame('loss', xp, coins);
    awardRewards(xp, coins);
  }, [safePointReached, endGame, awardRewards]);

  // ==========================================
  // Time Expired
  // ==========================================

  const handleTimeExpired = useCallback(() => {
    if (phase === 'playing') {
      const finalScore = safePointReached;
      const xp = calculateXP(finalScore, 'millionaire');
      const coins = calculateCoins(finalScore, 'millionaire');
      endGame('timeout', xp, coins);
      awardRewards(xp, coins);
    }
  }, [phase, safePointReached, endGame, awardRewards]);

  // ==========================================
  // Joker Handlers
  // ==========================================

  const handleUseJoker = useCallback(
    (type: JokerType) => {
      if (!currentQuestion || phase !== 'playing') return;

      useJoker(type);

      switch (type) {
        case 'fifty_fifty': {
          // Eliminate 2 wrong answers
          const wrongOptions = (['A', 'B', 'C', 'D'] as const).filter(
            (k) => k !== currentQuestion.correct_answer && !eliminatedOptions.includes(k),
          );
          const toEliminate = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2);
          setEliminatedOptions((prev) => [...prev, ...toEliminate]);
          break;
        }

        case 'audience': {
          // Generate audience distribution — correct answer gets 40-70%
          const correct = currentQuestion.correct_answer;
          const correctPercent = Math.floor(Math.random() * 31) + 40; // 40-70
          const remaining = 100 - correctPercent;
          const others = (['A', 'B', 'C', 'D'] as const).filter((k) => k !== correct);
          const r1 = Math.floor(Math.random() * remaining);
          const r2 = Math.floor(Math.random() * (remaining - r1));
          const r3 = remaining - r1 - r2;

          const distribution = { A: 0, B: 0, C: 0, D: 0 };
          distribution[correct] = correctPercent;
          distribution[others[0]] = r1;
          distribution[others[1]] = r2;
          distribution[others[2]] = r3;

          setAudienceResult(distribution);
          break;
        }

        case 'phone': {
          // Friend suggests correct answer with 60-90% confidence
          const confidence = Math.floor(Math.random() * 31) + 60;
          // 80% chance friend is correct
          const isCorrect = Math.random() < 0.8;
          const suggestion = isCorrect
            ? currentQuestion.correct_answer
            : (['A', 'B', 'C', 'D'] as const).filter((k) => k !== currentQuestion.correct_answer)[
                Math.floor(Math.random() * 3)
              ];

          setPhoneResult({ suggestion, confidence });
          break;
        }

        case 'freeze_time': {
          // Add 15 seconds
          timer.addTime(15);
          break;
        }

        case 'skip': {
          // Skip to next question without penalty
          setPhase('transitioning');
          answerQuestion(false, 0); // counts as answered but no points

          setTimeout(() => {
            nextQuestion();
            setSelectedAnswer(null);
            setCorrectAnswer(null);
            setEliminatedOptions([]);
            setAudienceResult(null);
            setPhoneResult(null);
            setDoubleAnswerActive(false);
            setFirstWrongAnswer(null);

            const nextQ = questions[questionNumber];
            if (nextQ) {
              setCurrentQuestion(nextQ);
              const nextStep = getMillionaireStep(questionNumber + 1);
              timer.reset(nextStep?.timeLimit ?? 30);
              timer.start();
              setPhase('playing');
            }
          }, 800);
          break;
        }

        case 'double_answer': {
          // Allow one wrong guess before failing
          setDoubleAnswerActive(true);
          break;
        }
      }
    },
    [currentQuestion, phase, eliminatedOptions, useJoker, timer, answerQuestion, nextQuestion, setCurrentQuestion, questions, questionNumber],
  );

  // ==========================================
  // Play Again / Go Home
  // ==========================================

  const handlePlayAgain = useCallback(() => {
    // Check energy before replaying
    const currentEnergy = user?.energy ?? 0;
    if (currentEnergy < ENERGY_CONFIG.cost_millionaire) {
      setShowEnergyWarning(true);
      return;
    }

    setPhase('loading');
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    setEliminatedOptions([]);
    setAudienceResult(null);
    setPhoneResult(null);
    setDoubleAnswerActive(false);
    setFirstWrongAnswer(null);
    setShowRewardOverlay(false);

    const gameQuestions = getMillionaireQuestions();
    setQuestions(gameQuestions);

    const sessionId = `session_${Date.now()}`;
    resetGame();
    startGame('millionaire', 'turkey', sessionId);

    // Deduct energy
    if (user) {
      updateEnergy(-ENERGY_CONFIG.cost_millionaire);
    }

    if (gameQuestions.length > 0) {
      setCurrentQuestion(gameQuestions[0]);
      setPhase('playing');
      setTimeout(() => {
        timer.reset(MILLIONAIRE_STEPS[0].timeLimit);
        timer.start();
      }, 500);
    }
  }, [resetGame, startGame, setCurrentQuestion, timer, user, updateEnergy]);

  const handleGoHome = useCallback(() => {
    resetGame();
    router.push('/');
  }, [resetGame, router]);

  // ==========================================
  // Energy Warning Handlers
  // ==========================================

  const handleEnergyConfirm = useCallback(() => {
    setShowEnergyWarning(false);
    initializeGame();
  }, [initializeGame]);

  const handleEnergyCancel = useCallback(() => {
    setShowEnergyWarning(false);
    router.push('/');
  }, [router]);

  // ==========================================
  // Reward Overlay Complete → show result screen
  // ==========================================

  const handleRewardComplete = useCallback(() => {
    setShowRewardOverlay(false);
    setPhase('result');
  }, []);

  // ==========================================
  // Loading State
  // ==========================================

  if (phase === 'loading' || !currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="mb-4 text-5xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            ⚽
          </motion.div>
          <p className="text-sm text-text-secondary">Sorular yükleniyor...</p>
        </motion.div>

        {/* Energy warning overlay */}
        <EnergyWarning
          isVisible={showEnergyWarning}
          currentEnergy={user?.energy ?? 0}
          onConfirm={handleEnergyConfirm}
          onCancel={handleEnergyCancel}
        />
      </div>
    );
  }

  // ==========================================
  // Reward Overlay (shown before result screen)
  // ==========================================

  if (showRewardOverlay) {
    return (
      <RewardOverlay
        isVisible={true}
        xp={pendingRewards.xp}
        coins={pendingRewards.coins}
        levelUp={pendingRewards.levelUp}
        onComplete={handleRewardComplete}
      />
    );
  }

  // ==========================================
  // Result Screen
  // ==========================================

  if (phase === 'result') {
    return (
      <GameResultScreen
        result={result ?? 'loss'}
        score={score}
        correctAnswers={correctAnswers}
        totalAnswered={totalAnswered}
        xpEarned={xpEarned}
        coinsEarned={coinsEarned}
        questionReached={questionNumber}
        totalQuestions={15}
        safePointScore={safePointReached}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />
    );
  }

  // ==========================================
  // Active Game UI
  // ==========================================

  return (
    <div className="flex min-h-screen flex-col p-4 pb-8">
      {/* Top bar — Timer + Prize info */}
      <motion.div
        className="mb-4 space-y-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Timer */}
        <TimerBar
          timeRemaining={timer.timeRemaining}
          totalTime={timer.totalTime}
          isRunning={timer.isRunning}
          isExpired={timer.isExpired}
        />

        {/* Mini prize indicator */}
        <MiniPrize
          currentQuestion={questionNumber}
          score={score}
          safePointScore={safePointScore}
          onOpenLadder={() => setShowPrizeLadder(true)}
        />
      </motion.div>

      {/* Question card */}
      <motion.div
        className="glass-card mb-5 p-5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        key={`question-${questionNumber}`}
      >
        {/* Question number + category */}
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-500">
            Soru {questionNumber}/15
          </span>
          <span className="text-xs text-text-muted">
            {currentQuestion.category}
          </span>
        </div>

        {/* Question text */}
        <h2 className="font-display text-lg font-bold leading-snug text-text-primary">
          {currentQuestion.question_text}
        </h2>

        {/* Points for this question */}
        <div className="mt-3 flex items-center gap-1.5">
          <span className="text-xs text-text-muted">Bu soru:</span>
          <span className="font-mono text-sm font-bold text-secondary-500">
            {currentStep ? formatNumber(currentStep.points) : '0'} puan
          </span>
        </div>
      </motion.div>

      {/* Joker results (audience / phone) */}
      <AnimatePresence>
        {audienceResult && (
          <motion.div
            className="mb-4"
            exit={{ opacity: 0, height: 0 }}
          >
            <AudienceResult distribution={audienceResult} />
          </motion.div>
        )}
        {phoneResult && (
          <motion.div
            className="mb-4"
            exit={{ opacity: 0, height: 0 }}
          >
            <PhoneResult
              suggestion={phoneResult.suggestion}
              confidence={phoneResult.confidence}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer options */}
      <div className="mb-5">
        <AnswerGrid
          options={currentQuestion.options}
          selectedAnswer={selectedAnswer}
          correctAnswer={correctAnswer}
          eliminatedOptions={eliminatedOptions}
          disabled={phase !== 'playing'}
          onSelect={handleSelectAnswer}
          showDoubleAnswer={doubleAnswerActive}
        />
      </div>

      {/* Explanation after reveal */}
      <AnimatePresence>
        {phase === 'revealing' && currentQuestion.explanation && (
          <motion.div
            className="mb-5 rounded-xl border border-primary-500/20 bg-primary-500/5 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-xs font-medium text-primary-500">💡 Bilgi</p>
            <p className="mt-1 text-sm text-text-secondary">
              {currentQuestion.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Joker bar */}
      <div className="mt-auto">
        <JokerBar
          jokers={jokers}
          onUseJoker={handleUseJoker}
          disabled={phase !== 'playing'}
        />
      </div>

      {/* Prize ladder modal */}
      <AnimatePresence>
        <PrizeLadder
          currentQuestion={questionNumber}
          isOpen={showPrizeLadder}
          onClose={() => setShowPrizeLadder(false)}
        />
      </AnimatePresence>

      {/* Energy warning for play again */}
      <EnergyWarning
        isVisible={showEnergyWarning}
        currentEnergy={user?.energy ?? 0}
        onConfirm={handleEnergyConfirm}
        onCancel={handleEnergyCancel}
      />
    </div>
  );
}
