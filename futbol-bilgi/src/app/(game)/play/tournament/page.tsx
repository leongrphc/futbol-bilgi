'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, Target, Clock3, ChevronRight, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnswerGrid } from '@/components/game/answer-option';
import { TimerBar } from '@/components/game/timer-bar';
import { RewardOverlay } from '@/components/game/reward-overlay';
import { GameResultScreen } from '@/components/game/game-result';
import { ShareButton } from '@/components/social/share-button';
import { buildQuestionChallengeShare } from '@/lib/utils/share';
import { useGameStore } from '@/lib/stores/game-store';
import { useUserStore } from '@/lib/stores/user-store';
import { useTimer } from '@/lib/hooks/use-timer';
import { trackEvent } from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { TOURNAMENT_CONFIG } from '@/lib/constants/game';
import { calculateLevel, formatNumber } from '@/lib/utils/game';
import { getTournamentRoundQuestions } from '@/lib/data/mock-questions';
import type { Question } from '@/types';

type TournamentPhase = 'lobby' | 'loading' | 'playing' | 'revealing' | 'between-rounds' | 'result';

interface LiveTournament {
  id: string;
  title: string;
  description: string | null;
  league_scope: string;
  status: 'scheduled' | 'live' | 'completed';
  max_players: number;
  current_players: number;
  starts_at: string;
}

const ROUND_LABELS = ['Çeyrek Final', 'Yarı Final', 'Final'] as const;

export default function TournamentPage() {
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
    setTimeRemaining,
  } = useGameStore();

  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [phase, setPhase] = useState<TournamentPhase>('lobby');
  const [liveTournaments, setLiveTournaments] = useState<LiveTournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<LiveTournament | null>(null);
  const [isJoiningTournament, setIsJoiningTournament] = useState(false);
  const [round, setRound] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [roundStartScore, setRoundStartScore] = useState(0);
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const [rewardData, setRewardData] = useState<{ xp: number; coins: number; levelUp: { from: number; to: number } | null }>({
    xp: 0,
    coins: 0,
    levelUp: null,
  });

  const hasInitializedRef = useRef(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQuestion = questions[questionNumber - 1] ?? null;
  const roundQuestionCount = TOURNAMENT_CONFIG.questions_per_round;
  const totalQuestions = TOURNAMENT_CONFIG.total_rounds * TOURNAMENT_CONFIG.questions_per_round;
  const currentRoundLabel = ROUND_LABELS[Math.max(0, Math.min(ROUND_LABELS.length - 1, round - 1))];
  const canAdvanceRound = score - roundStartScore >= TOURNAMENT_CONFIG.points_per_correct * 2;

  const timer = useTimer({
    initialTime: TOURNAMENT_CONFIG.time_per_question,
    autoStart: false,
    onExpire: () => {
      if (phase === 'playing') {
        handleSelectAnswer(currentQuestion?.correct_answer === 'A' ? 'B' : 'A');
      }
    },
  });

  const prepareRound = useCallback((nextRound: number) => {
    const roundQuestions = getTournamentRoundQuestions(nextRound, selectedScope);
    setQuestions(roundQuestions);
    setRound(nextRound);
    resetGame();
    startGame('quick', selectedScope, `tournament-round-${nextRound}-${Date.now()}`);
    setRoundStartScore(score);

    if (roundQuestions.length > 0) {
      setCurrentQuestion(roundQuestions[0]);
      setPhase('playing');
      timer.reset(TOURNAMENT_CONFIG.time_per_question);
      timer.start();
    }
  }, [resetGame, score, selectedScope, setCurrentQuestion, startGame, timer]);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    trackEvent(ANALYTICS_EVENTS.TOURNAMENT_MODE_VIEWED, { scope: selectedScope });
    trackEvent(ANALYTICS_EVENTS.LIVE_TOURNAMENTS_VIEWED, { scope: selectedScope });

    const loadTournaments = async () => {
      const response = await fetch('/api/tournaments');
      const json = await response.json();
      if (response.ok && json.data) {
        setLiveTournaments((json.data as LiveTournament[]).filter((tournament) => tournament.league_scope === selectedScope || tournament.league_scope === 'turkey'));
      }
    };

    void loadTournaments();
  }, [selectedScope]);

  useEffect(() => {
    setTimeRemaining(timer.timeRemaining);
  }, [setTimeRemaining, timer.timeRemaining]);

  const finalizeTournament = useCallback(() => {
    if (!user) {
      setPhase('result');
      return;
    }

    const xp = TOURNAMENT_CONFIG.completion_xp;
    const coins = TOURNAMENT_CONFIG.completion_coins;
    const currentLevel = calculateLevel(user.xp).level;
    const nextXp = user.xp + xp;
    const nextLevel = calculateLevel(nextXp).level;
    const levelUp = nextLevel > currentLevel ? { from: currentLevel, to: nextLevel } : null;

    setUser({
      ...user,
      xp: nextXp,
      coins: user.coins + coins,
      level: nextLevel,
    });
    endGame('win', xp, coins);
    setRewardData({ xp, coins, levelUp });
    setShowRewardOverlay(true);
    trackEvent(ANALYTICS_EVENTS.TOURNAMENT_RUN_COMPLETED, {
      scope: selectedScope,
      result: 'win',
      round,
      score,
    });
  }, [endGame, round, score, selectedScope, setUser, user]);

  const handleSelectAnswer = useCallback((answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion || phase !== 'playing') return;

    const isCorrect = answer === currentQuestion.correct_answer;
    setSelectedAnswer(answer);
    setCorrectAnswer(currentQuestion.correct_answer);
    setPhase('revealing');
    answerQuestion(isCorrect, isCorrect ? TOURNAMENT_CONFIG.points_per_correct : 0);

    revealTimeoutRef.current = setTimeout(() => {
      if (questionNumber >= roundQuestionCount) {
        if (round >= TOURNAMENT_CONFIG.total_rounds) {
          finalizeTournament();
          return;
        }

        setPhase('between-rounds');
        return;
      }

      nextQuestion();
      const nextRoundQuestion = questions[questionNumber];
      if (nextRoundQuestion) {
        setCurrentQuestion(nextRoundQuestion);
      }
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setPhase('playing');
      timer.reset(TOURNAMENT_CONFIG.time_per_question);
      timer.start();
    }, 1300);
  }, [answerQuestion, currentQuestion, finalizeTournament, nextQuestion, phase, questionNumber, questions, round, roundQuestionCount, setCurrentQuestion, timer]);

  const handleJoinTournament = useCallback(async (tournament: LiveTournament) => {
    setIsJoiningTournament(true);
    const response = await fetch('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId: tournament.id }),
    });

    const json = await response.json();
    setIsJoiningTournament(false);

    if (!response.ok || !json.data) {
      return;
    }

    setSelectedTournament(tournament);
    setPhase('loading');
    trackEvent(ANALYTICS_EVENTS.LIVE_TOURNAMENT_JOINED, {
      tournament_id: tournament.id,
      scope: selectedScope,
    });
    trackEvent(ANALYTICS_EVENTS.TOURNAMENT_RUN_STARTED, {
      scope: selectedScope,
      tournament_id: tournament.id,
    });
    prepareRound(1);
  }, [prepareRound, selectedScope]);

  const handleAdvanceRound = useCallback(() => {
    const nextRound = round + 1;
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    prepareRound(nextRound);
  }, [prepareRound, round]);

  const handleRewardComplete = useCallback(() => {
    setShowRewardOverlay(false);
    setPhase('result');
  }, []);

  const handleRestart = useCallback(() => {
    router.refresh();
  }, [router]);

  if (phase === 'lobby') {
    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="mx-auto max-w-3xl space-y-4">
          <Card padding="lg" variant="highlighted">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-text-secondary">Canlı Turnuvalar</p>
                <h1 className="mt-1 font-display text-2xl font-bold text-text-primary">Katılabileceğin Turnuvalar</h1>
                <p className="mt-2 text-sm text-text-secondary">Scope bazlı planlanan ve aktif turnuvalara katıl, ardından 3 turlu mini bracket akışını oyna.</p>
              </div>
              <div className="rounded-2xl bg-primary-500/12 p-4">
                <Users className="h-8 w-8 text-primary-500" />
              </div>
            </div>
          </Card>

          {liveTournaments.length === 0 ? (
            <Card padding="lg" className="text-center">
              <p className="font-display text-lg font-semibold text-text-primary">Şu anda uygun turnuva yok</p>
              <p className="mt-2 text-sm text-text-secondary">Yeni turnuva açıldığında burada görünecek.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {liveTournaments.map((tournament) => (
                <Card key={tournament.id} padding="lg" className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-text-secondary">{tournament.league_scope} · {tournament.status}</p>
                      <h2 className="font-display text-xl font-bold text-text-primary">{tournament.title}</h2>
                      <p className="mt-1 text-sm text-text-secondary">{tournament.description}</p>
                    </div>
                    <span className="rounded-full bg-primary-500 px-3 py-1 text-xs font-bold text-white">{tournament.current_players}/{tournament.max_players}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>Başlangıç: {new Date(tournament.starts_at).toLocaleString('tr-TR')}</span>
                    <span>{tournament.status === 'live' ? 'Şimdi açık' : 'Yakında'}</span>
                  </div>
                  <Button onClick={() => void handleJoinTournament(tournament)} isLoading={isJoiningTournament && selectedTournament?.id === tournament.id} fullWidth>
                    Katıl ve Oyna
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

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
        questionReached={totalQuestions}
        totalQuestions={totalQuestions}
        safePointScore={score}
        onPlayAgain={handleRestart}
        onGoHome={() => router.push('/play')}
      />
    );
  }

  if (phase === 'between-rounds') {
    return (
      <div className="min-h-screen p-4 pb-24 flex items-center justify-center">
        <Card padding="lg" className="w-full max-w-lg text-center space-y-4">
          <Trophy className="mx-auto h-14 w-14 text-secondary-500" />
          <div>
            <p className="text-sm text-text-secondary">Tur tamamlandı</p>
            <h1 className="font-display text-2xl font-bold text-text-primary">{currentRoundLabel}</h1>
          </div>
          <p className="text-sm text-text-secondary">
            {canAdvanceRound
              ? 'Yeterli puanı topladın. Bir sonraki tura geçebilirsin.'
              : 'Bu prototip sürümde yine de ilerleyebilirsin; sonraki iterasyonda eleme kuralı sertleşecek.'}
          </p>
          <Button onClick={handleAdvanceRound} fullWidth>
            <ChevronRight className="h-4 w-4" />
            Sonraki Tur
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen p-4 pb-24 flex items-center justify-center">
        <Card padding="lg" className="text-center">
          <p className="text-text-secondary">Turnuva eşleşmeleri hazırlanıyor...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="mx-auto max-w-xl space-y-4">
        <Card padding="md">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Turnuva Modu</p>
              <p className="font-display text-lg font-bold text-text-primary">{currentRoundLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Skor</p>
              <p className="font-display text-lg font-bold text-primary-500">{formatNumber(score)}</p>
            </div>
          </div>
          <TimerBar
            timeRemaining={timer.timeRemaining}
            totalTime={TOURNAMENT_CONFIG.time_per_question}
            isRunning={timer.isRunning}
            isExpired={timer.isExpired}
          />
          <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
            <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" /> {questionNumber}/{roundQuestionCount}</span>
            <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {selectedScope === 'turkey' ? 'Türkiye' : selectedScope === 'europe' ? 'Avrupa' : 'Dünya'} kapsamı</span>
          </div>
        </Card>

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
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card padding="md" className="border-primary-500/20 bg-primary-500/5">
                <p className="text-sm text-text-secondary">
                  {selectedAnswer === currentQuestion.correct_answer ? `Doğru cevap! +${TOURNAMENT_CONFIG.points_per_correct} puan` : 'Yanlış cevap. Tur devam ediyor...'}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
