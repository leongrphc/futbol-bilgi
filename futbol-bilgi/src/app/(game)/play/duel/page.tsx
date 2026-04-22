'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Swords, Trophy, TimerReset, ShieldAlert, Zap, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnswerGrid } from '@/components/game/answer-option';
import { TimerBar } from '@/components/game/timer-bar';
import { RewardOverlay, EnergyWarning } from '@/components/game/reward-overlay';
import { ShareButton } from '@/components/social/share-button';
import { buildQuestionChallengeShare } from '@/lib/utils/share';
import { trackEvent } from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { useTimer } from '@/lib/hooks/use-timer';
import { useUserStore } from '@/lib/stores/user-store';
import { useSocialStore } from '@/lib/stores/social-store';
import { useLeagueStore } from '@/lib/stores/league-store';
import { DUEL_CONFIG, ENERGY_CONFIG } from '@/lib/constants/game';
import {
  calculateLevel,
  calculateDuelEloDelta,
  calculateDuelQuestionScore,
  calculateDuelWinner,
  formatNumber,
  generateMockOpponentElo,
  generateMockOpponentResponse,
  sumAnswerTimesMs,
} from '@/lib/utils/game';
import type { Question } from '@/types';

type DuelPhase = 'loading' | 'searching' | 'matched' | 'countdown' | 'playing' | 'revealing' | 'result';

interface MockOpponent {
  id: string;
  username: string;
  elo: number;
  avatar: string;
}

const OPPONENT_NAMES = ['AslanKral', 'KartalRuhu', 'Kanarya1907', 'KaradenizGol', 'AnadoluYıldızı', 'TribunBeyni', 'FutbolUstasi', 'DerbiAvcısı'];

export default function DuelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const profiles = useSocialStore((state) => state.profiles);
  const duelInvites = useSocialStore((state) => state.duelInvites);
  const hydrateSocial = useSocialStore((state) => state.hydrate);
  const syncCurrentUser = useSocialStore((state) => state.syncCurrentUser);
  const markUserActive = useSocialStore((state) => state.markUserActive);
  const ensurePlayerEntry = useLeagueStore((state) => state.ensurePlayerEntry);
  const recordDuelResult = useLeagueStore((state) => state.recordDuelResult);

  const [phase, setPhase] = useState<DuelPhase>('loading');
  const [showEnergyWarning, setShowEnergyWarning] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [opponent, setOpponent] = useState<MockOpponent | null>(null);
  const [challengeInviteId, setChallengeInviteId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerAnsweredCount, setPlayerAnsweredCount] = useState(0);
  const [opponentAnsweredCount, setOpponentAnsweredCount] = useState(0);
  const [playerAnswerTimes, setPlayerAnswerTimes] = useState<number[]>([]);
  const [opponentAnswerTimes, setOpponentAnswerTimes] = useState<number[]>([]);
  const [opponentStatus, setOpponentStatus] = useState<'thinking' | 'answered' | 'correct' | 'wrong' | 'timeout'>('thinking');
  const [lastRoundSummary, setLastRoundSummary] = useState<{ playerDelta: number; opponentDelta: number } | null>(null);
  const [result, setResult] = useState<'win' | 'loss' | 'draw'>('draw');
  const [eloDelta, setEloDelta] = useState(0);
  const [rewardData, setRewardData] = useState<{ xp: number; coins: number; levelUp: { from: number; to: number } | null }>({ xp: 0, coins: 0, levelUp: null });
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  const currentQuestion = questions[questionIndex] ?? null;
  const challengeInviteIdFromQuery = searchParams.get('invite');
  const isChallengeMode = Boolean(challengeInviteIdFromQuery);
  const totalQuestions = DUEL_CONFIG.total_questions;
  const challengeOpponentProfile = useMemo(() => {
    if (!challengeInviteIdFromQuery || !user) return null;
    const invite = duelInvites.find((item) => item.id === challengeInviteIdFromQuery);
    if (!invite) return null;
    const opponentId = invite.from_user_id === user.id ? invite.to_user_id : invite.from_user_id;
    return profiles.find((profile) => profile.id === opponentId) ?? null;
  }, [challengeInviteIdFromQuery, duelInvites, profiles, user]);
  const pendingRevealRef = useRef(false);

  const timer = useTimer({
    initialTime: DUEL_CONFIG.time_per_question,
    autoStart: false,
    onExpire: () => {
      if (phase === 'playing' && !pendingRevealRef.current) {
        handlePlayerAnswer(null, true);
      }
    },
  });

  const createMockOpponent = useCallback((): MockOpponent => {
    const elo = generateMockOpponentElo(user?.elo_rating ?? 1000);
    const username = OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
    return {
      id: `mock_${Date.now()}`,
      username,
      elo,
      avatar: username.charAt(0),
    };
  }, [user?.elo_rating]);

  const startDuel = useCallback(async () => {
    if (!user) return;

    const response = await fetch('/api/game/duel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isChallengeMode && challengeInviteIdFromQuery ? { inviteId: challengeInviteIdFromQuery } : {}),
    });
    const json = await response.json();

    if (!response.ok || !json.data) {
      setShowEnergyWarning(true);
      return;
    }

    const sessionId = json.data.sessionId as string;
    sessionIdRef.current = sessionId;
    setUser({
      ...user,
      ...json.data.profile,
    });

    trackEvent(ANALYTICS_EVENTS.GAME_STARTED, {
      mode: 'duel',
      session_id: sessionId,
      league_scope: user.league_tier,
      question_count: DUEL_CONFIG.total_questions,
      challenge_invite_id: json.data.inviteId ?? null,
    });

    if (isChallengeMode) {
      setChallengeInviteId((json.data.inviteId as string | null) ?? challengeInviteIdFromQuery);
      const challengeQuestions = (json.data.questions ?? []) as Question[];
      if (challengeQuestions.length < DUEL_CONFIG.total_questions) {
        setShowEnergyWarning(true);
        return;
      }
      setQuestions(challengeQuestions);
      const challengeOpponent = json.data.opponent as { id: string; username: string; elo: number } | undefined;
      setOpponent(challengeOpponent ? {
        id: challengeOpponent.id,
        username: challengeOpponent.username,
        elo: challengeOpponent.elo,
        avatar: challengeOpponent.username.charAt(0),
      } : createMockOpponent());
      setPhase('matched');
      return;
    }

    const duelQuestions = (json.data.questions ?? []) as Question[];
    if (duelQuestions.length < DUEL_CONFIG.total_questions) {
      setShowEnergyWarning(true);
      return;
    }
    setQuestions(duelQuestions);
    setOpponent(createMockOpponent());
    setPhase('searching');
  }, [user, setUser, createMockOpponent, isChallengeMode, challengeInviteIdFromQuery]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    syncCurrentUser(user);
    void hydrateSocial(user);
    void markUserActive();
    ensurePlayerEntry(user.id, user.league_tier);

    if (user.energy < ENERGY_CONFIG.cost_duel || sessionIdRef.current) {
      return;
    }

    void startDuel();
  }, [user, router, startDuel, syncCurrentUser, hydrateSocial, markUserActive, ensurePlayerEntry]);

  useEffect(() => {
    if (phase !== 'searching') return;

    const timeout = setTimeout(() => {
      setPhase('matched');
    }, 1800);

    return () => clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'matched') return;

    const timeout = setTimeout(() => {
      setPhase('countdown');
      setCountdown(3);
    }, 1200);

    return () => clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'countdown') return;

    const timeout = setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(0);
        setPhase('playing');
        timer.reset(DUEL_CONFIG.time_per_question);
        timer.start();
        return;
      }

      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [phase, countdown, timer]);

  const playerTotalTimeMs = sumAnswerTimesMs(playerAnswerTimes);

  const finishDuel = useCallback(async (winner: 'player' | 'opponent' | 'draw') => {
    if (!user || !opponent) return;

    const duelResult = winner === 'player' ? 'win' : winner === 'opponent' ? 'loss' : 'draw';
    const duelScore = winner === 'player' ? 1 : winner === 'opponent' ? 0 : 0.5;
    const computedEloDelta = calculateDuelEloDelta(user.elo_rating, opponent.elo, duelScore);

    trackEvent(ANALYTICS_EVENTS.GAME_COMPLETED, {
      mode: 'duel',
      session_id: sessionIdRef.current,
      result: duelResult,
      score: playerScore,
      correct_answers: playerAnsweredCount,
      total_answered: totalQuestions,
      xp_earned: winner === 'player' ? DUEL_CONFIG.winner_xp : 0,
      coins_earned: winner === 'player' ? DUEL_CONFIG.winner_coins : 0,
      elo_delta: computedEloDelta,
    });

    const response = await fetch('/api/game/duel', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionIdRef.current,
        result: duelResult,
        score: playerScore,
        correctAnswers: playerAnsweredCount,
        totalAnswered: totalQuestions,
        opponentElo: opponent.elo,
        inviteId: challengeInviteId,
        answerTimeMs: playerTotalTimeMs,
      }),
    });

    const json = await response.json();
    if (!response.ok || !json.data) {
      return;
    }

    const effectiveResult = (json.data.duelResult as 'win' | 'loss' | 'draw' | undefined) ?? duelResult;
    setResult(effectiveResult);
    recordDuelResult(user.id, user.league_tier, effectiveResult);
    setEloDelta(json.data.rewards.eloDelta);
    setUser({
      ...user,
      ...json.data.profile,
    });

    if (effectiveResult === 'win') {
      const currentLevel = calculateLevel(user.xp).level;
      const newLevel = calculateLevel(json.data.profile.xp).level;
      const levelUp = newLevel > currentLevel ? { from: currentLevel, to: newLevel } : null;
      setRewardData({ xp: json.data.rewards.xp, coins: json.data.rewards.coins, levelUp });
      setShowRewardOverlay(true);
      return;
    }

    setPhase('result');
  }, [user, opponent, playerScore, playerAnsweredCount, totalQuestions, recordDuelResult, setUser, challengeInviteId, playerTotalTimeMs]);

  const goToNextQuestion = useCallback(() => {
    pendingRevealRef.current = false;
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    setOpponentStatus('thinking');
    setLastRoundSummary(null);

    if (questionIndex + 1 >= totalQuestions) {
      const winner = calculateDuelWinner(
        playerScore,
        opponentScore,
        sumAnswerTimesMs(playerAnswerTimes),
        sumAnswerTimesMs(opponentAnswerTimes),
      );
      void finishDuel(winner);
      return;
    }

    setQuestionIndex((prev) => prev + 1);
    setPhase('playing');
    timer.reset(DUEL_CONFIG.time_per_question);
    timer.start();
  }, [questionIndex, totalQuestions, playerScore, opponentScore, playerAnswerTimes, opponentAnswerTimes, finishDuel, timer]);

  const handlePlayerAnswer = useCallback((answer: 'A' | 'B' | 'C' | 'D' | null, timedOut = false) => {
    if (!currentQuestion || pendingRevealRef.current) return;

    pendingRevealRef.current = true;
    timer.pause();
    setPhase('revealing');
    setSelectedAnswer(answer);
    setCorrectAnswer(currentQuestion.correct_answer);

    const playerIsCorrect = answer === currentQuestion.correct_answer;
    const playerTimeRemaining = timedOut ? 0 : timer.timeRemaining;
    const playerTimeSpent = DUEL_CONFIG.time_per_question - playerTimeRemaining;
    const playerRoundScore = calculateDuelQuestionScore(playerIsCorrect, playerTimeRemaining);
    const opponentRound = generateMockOpponentResponse(currentQuestion.difficulty, DUEL_CONFIG.time_per_question);

    setPlayerScore((prev) => prev + playerRoundScore);
    setOpponentScore((prev) => prev + opponentRound.score);
    setPlayerAnsweredCount((prev) => prev + (playerIsCorrect ? 1 : 0));
    setOpponentAnsweredCount((prev) => prev + (opponentRound.isCorrect ? 1 : 0));
    setPlayerAnswerTimes((prev) => [...prev, playerTimeSpent]);
    setOpponentAnswerTimes((prev) => [...prev, opponentRound.timeSpent]);
    setLastRoundSummary({ playerDelta: playerRoundScore, opponentDelta: opponentRound.score });
    setOpponentStatus(opponentRound.isCorrect ? 'correct' : opponentRound.timeSpent >= DUEL_CONFIG.time_per_question ? 'timeout' : 'wrong');

    const revealAnswered = setTimeout(() => {
      setOpponentStatus('answered');
    }, 800);

    const nextQuestionTimeout = setTimeout(() => {
      clearTimeout(revealAnswered);
      goToNextQuestion();
    }, 2500);

    return () => {
      clearTimeout(revealAnswered);
      clearTimeout(nextQuestionTimeout);
    };
  }, [currentQuestion, timer, goToNextQuestion]);

  const handleSelectAnswer = useCallback((answer: 'A' | 'B' | 'C' | 'D') => {
    if (phase !== 'playing') return;
    handlePlayerAnswer(answer, false);
  }, [phase, handlePlayerAnswer]);

  const handleEnergyConfirm = useCallback(() => {
    setShowEnergyWarning(false);
    void startDuel();
  }, [startDuel]);

  const handleEnergyCancel = useCallback(() => {
    setShowEnergyWarning(false);
    router.push('/play');
  }, [router]);

  const handlePlayAgain = useCallback(() => {
    if (!user || user.energy < DUEL_CONFIG.energy_cost) {
      setShowEnergyWarning(true);
      return;
    }

    setPhase('loading');
    setQuestions([]);
    setOpponent(null);
    setCountdown(3);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setCorrectAnswer(null);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerAnsweredCount(0);
    setOpponentAnsweredCount(0);
    setPlayerAnswerTimes([]);
    setOpponentAnswerTimes([]);
    setOpponentStatus('thinking');
    setLastRoundSummary(null);
    setShowRewardOverlay(false);
    setRewardData({ xp: 0, coins: 0, levelUp: null });
    pendingRevealRef.current = false;
    void startDuel();
  }, [user, startDuel]);

  const handleRewardComplete = useCallback(() => {
    setShowRewardOverlay(false);
    setPhase('result');
  }, []);

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

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="mx-auto max-w-xl space-y-4">
        {user && duelInvites.some((invite) => invite.to_user_id === user.id && invite.status === 'pending') && (
          <Card padding="md" variant="highlighted">
            <p className="text-sm text-text-secondary">
              Bekleyen düello davetin var. Profil ve sıralama ekranlarından arkadaşlarını yönetebilirsin.
            </p>
          </Card>
        )}

        {(phase === 'loading' || phase === 'searching' || phase === 'matched' || phase === 'countdown') && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[70vh] flex-col items-center justify-center">
            <Card padding="lg" className="w-full max-w-sm text-center">
              <motion.div
                animate={phase === 'searching' ? { rotate: 360 } : { scale: [1, 1.05, 1] }}
                transition={phase === 'searching' ? { duration: 1.5, repeat: Infinity, ease: 'linear' } : { duration: 1, repeat: Infinity }}
              >
                <Swords className="mx-auto mb-4 h-16 w-16 text-orange-500" />
              </motion.div>

              {phase === 'searching' && (
                <>
                  <h1 className="mb-2 font-display text-2xl font-bold text-text-primary">Rakip Aranıyor</h1>
                  <p className="text-text-secondary">ELO seviyene yakın bir rakip bulunuyor...</p>
                </>
              )}

              {isChallengeMode && challengeOpponentProfile && (
                <p className="mt-3 text-sm text-text-secondary">Arkadaş challengeı hazırlanıyor: {challengeOpponentProfile.username}</p>
              )}

              {phase === 'matched' && opponent && (
                <>
                  <h1 className="mb-4 font-display text-2xl font-bold text-text-primary">Rakip Bulundu!</h1>
                  <div className="space-y-3">
                    <div className="rounded-xl bg-bg-elevated p-4">
                      <p className="text-xs text-text-muted">Sen</p>
                      <p className="font-display text-lg font-bold text-text-primary">{user?.username}</p>
                      <p className="text-sm text-primary-500">ELO {user?.elo_rating}</p>
                    </div>
                    <div className="text-sm text-text-muted">VS</div>
                    <div className="rounded-xl bg-bg-elevated p-4">
                      <p className="text-xs text-text-muted">Rakip</p>
                      <p className="font-display text-lg font-bold text-text-primary">{opponent.username}</p>
                      <p className="text-sm text-orange-500">ELO {opponent.elo}</p>
                    </div>
                  </div>
                </>
              )}

              {phase === 'countdown' && (
                <>
                  <p className="mb-2 text-sm text-text-secondary">Maç başlıyor</p>
                  <motion.p
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-display text-6xl font-bold text-primary-500"
                  >
                    {countdown}
                  </motion.p>
                </>
              )}
            </Card>
          </motion.div>
        )}

        {(phase === 'playing' || phase === 'revealing') && currentQuestion && opponent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
              <PlayerCard label="Sen" name={user?.username ?? 'Oyuncu'} elo={user?.elo_rating ?? 1000} score={playerScore} correct={playerAnsweredCount} accent="primary" />
              <PlayerCard label="Rakip" name={opponent.username} elo={opponent.elo} score={opponentScore} correct={opponentAnsweredCount} accent="orange" />
            </motion.div>

            <Card padding="md">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted">Soru</p>
                  <p className="font-display text-lg font-bold text-text-primary">{questionIndex + 1}/{totalQuestions}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Rakip durumu</p>
                  <p className="text-sm font-medium text-text-primary">{getOpponentStatusLabel(opponentStatus)}</p>
                </div>
              </div>
              <TimerBar
                timeRemaining={timer.timeRemaining}
                totalTime={timer.totalTime}
                isRunning={timer.isRunning}
                isExpired={timer.isExpired}
              />
            </Card>

            <Card padding="lg">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-500">Düello</span>
                <span className="text-xs text-text-muted">{currentQuestion.category}</span>
              </div>
              <h2 className="font-display text-lg font-bold leading-snug text-text-primary">{currentQuestion.question_text}</h2>
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

            <AnswerGrid
              options={currentQuestion.options}
              selectedAnswer={selectedAnswer}
              correctAnswer={correctAnswer}
              eliminatedOptions={[]}
              disabled={phase !== 'playing'}
              onSelect={handleSelectAnswer}
            />

            <AnimatePresence>
              {phase === 'revealing' && lastRoundSummary && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <RoundResultCard title="Sen" icon={<Target className="h-4 w-4" />} score={lastRoundSummary.playerDelta} />
                  <RoundResultCard title="Rakip" icon={<Zap className="h-4 w-4" />} score={lastRoundSummary.opponentDelta} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {phase === 'result' && opponent && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card padding="lg" className="text-center">
              <div className="mb-4 text-5xl">{result === 'win' ? '🏆' : result === 'loss' ? '😓' : '🤝'}</div>
              <h1 className="font-display text-3xl font-bold text-text-primary">
                {result === 'win' ? 'Düelloyu Kazandın!' : result === 'loss' ? 'Düelloyu Kaybettin' : 'Berabere'}
              </h1>
              <p className="mt-2 text-sm text-text-secondary">{playerScore} - {opponentScore} skorla maç tamamlandı.</p>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Trophy className="h-4 w-4" />} label="Skorun" value={String(playerScore)} />
              <StatCard icon={<ShieldAlert className="h-4 w-4" />} label="Rakip Skoru" value={String(opponentScore)} />
              <StatCard icon={<TimerReset className="h-4 w-4" />} label="Toplam Süren" value={`${(playerTotalTimeMs / 1000).toFixed(1)}s`} />
              <StatCard icon={<Zap className="h-4 w-4" />} label="ELO" value={`${eloDelta >= 0 ? '+' : ''}${eloDelta}`} />
            </div>

            {result === 'win' && (
              <Card padding="md" variant="highlighted">
                <p className="text-sm text-text-secondary">
                  Ödülün hazır: <span className="font-bold text-accent-500">+{DUEL_CONFIG.winner_xp} XP</span> ve <span className="font-bold text-secondary-500">+{DUEL_CONFIG.winner_coins} coin</span>
                </p>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => router.push('/play')}>
                Geri Dön
              </Button>
              <Button variant="primary" fullWidth onClick={handlePlayAgain}>
                Tekrar Oyna
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <EnergyWarning
        isVisible={showEnergyWarning || (!!user && user.energy < ENERGY_CONFIG.cost_duel && phase === 'loading')}
        currentEnergy={user?.energy ?? 0}
        onConfirm={handleEnergyConfirm}
        onCancel={handleEnergyCancel}
      />
    </div>
  );
}

function PlayerCard({
  label,
  name,
  elo,
  score,
  correct,
  accent,
}: {
  label: string;
  name: string;
  elo: number;
  score: number;
  correct: number;
  accent: 'primary' | 'orange';
}) {
  const accentClass = accent === 'primary' ? 'text-primary-500' : 'text-orange-500';

  return (
    <Card padding="md">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-display text-lg font-bold text-text-primary">{name}</p>
      <p className={`text-sm ${accentClass}`}>ELO {elo}</p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-text-secondary">Skor</span>
        <span className="font-bold text-text-primary">{formatNumber(score)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-text-secondary">Doğru</span>
        <span className="font-bold text-text-primary">{correct}</span>
      </div>
    </Card>
  );
}

function RoundResultCard({ title, icon, score }: { title: string; icon: React.ReactNode; score: number }) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-2 text-text-secondary">
        {icon}
        <span className="text-sm">{title}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-text-primary">+{score}</p>
    </Card>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-2 text-text-secondary">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 font-display text-xl font-bold text-text-primary">{value}</p>
    </Card>
  );
}

function getOpponentStatusLabel(status: 'thinking' | 'answered' | 'correct' | 'wrong' | 'timeout') {
  switch (status) {
    case 'thinking':
      return 'Düşünüyor';
    case 'answered':
      return 'Cevapladı';
    case 'correct':
      return 'Doğru bildi';
    case 'wrong':
      return 'Yanlış yaptı';
    case 'timeout':
      return 'Süreyi doldurdu';
    default:
      return 'Bekliyor';
  }
}
