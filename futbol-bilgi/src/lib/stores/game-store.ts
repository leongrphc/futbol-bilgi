import { create } from 'zustand';
import type {
  GameMode,
  GameResult,
  GameState,
  JokerState,
  JokerType,
  LeagueScope,
  Question,
} from '@/types';
import { MILLIONAIRE_STEPS } from '@/lib/constants/game';

// ==========================================
// Default Jokers for Millionaire Mode
// ==========================================

function createDefaultJokers(jokerInventory?: Partial<Record<JokerType, number>>): JokerState[] {
  return [
    { type: 'fifty_fifty', isUsed: false, isAvailable: (jokerInventory?.fifty_fifty ?? 0) > 0 },
    { type: 'audience', isUsed: false, isAvailable: (jokerInventory?.audience ?? 0) > 0 },
    { type: 'phone', isUsed: false, isAvailable: (jokerInventory?.phone ?? 0) > 0 },
    { type: 'freeze_time', isUsed: false, isAvailable: (jokerInventory?.freeze_time ?? 0) > 0 },
    { type: 'skip', isUsed: false, isAvailable: (jokerInventory?.skip ?? 0) > 0 },
    { type: 'double_answer', isUsed: false, isAvailable: (jokerInventory?.double_answer ?? 0) > 0 },
  ];
}

// ==========================================
// Initial Game State
// ==========================================

const initialState: GameState = {
  mode: 'millionaire',
  sessionId: null,
  leagueScope: 'turkey',
  currentQuestion: null,
  questionNumber: 0,
  score: 0,
  correctAnswers: 0,
  totalAnswered: 0,
  jokers: createDefaultJokers(),
  timeRemaining: 30,
  isGameOver: false,
  result: null,
  safePointReached: 0,
  xpEarned: 0,
  coinsEarned: 0,
};

// ==========================================
// Game Store Actions
// ==========================================

interface GameActions {
  // Game lifecycle
  startGame: (mode: GameMode, leagueScope: LeagueScope, sessionId: string, jokerInventory?: Partial<Record<JokerType, number>>) => void;
  endGame: (result: GameResult, xp: number, coins: number) => void;
  resetGame: () => void;

  // Question flow
  setCurrentQuestion: (question: Question) => void;
  nextQuestion: () => void;
  answerQuestion: (isCorrect: boolean, points: number) => void;
  applyScoreBonus: (points: number) => void;

  // Jokers
  useJoker: (type: JokerType) => void;

  // Timer
  setTimeRemaining: (time: number) => void;
  tickTimer: () => void;

  // Safe points
  updateSafePoint: (points: number) => void;
}

export type GameStore = GameState & GameActions;

// ==========================================
// Zustand Store
// ==========================================

export const useGameStore = create<GameStore>()((set, get) => ({
  ...initialState,

  startGame: (mode, leagueScope, sessionId, jokerInventory) => {
    const timeLimit =
      mode === 'millionaire'
        ? MILLIONAIRE_STEPS[0].timeLimit
        : mode === 'quick'
          ? 120
          : 30;

    set({
      ...initialState,
      mode,
      leagueScope,
      sessionId,
      questionNumber: 1,
      timeRemaining: timeLimit,
      jokers: mode === 'millionaire' ? createDefaultJokers(jokerInventory) : [],
    });
  },

  endGame: (result, xp, coins) => {
    set({
      isGameOver: true,
      result,
      xpEarned: xp,
      coinsEarned: coins,
    });
  },

  resetGame: () => {
    set(initialState);
  },

  setCurrentQuestion: (question) => {
    set({ currentQuestion: question });
  },

  nextQuestion: () => {
    const { questionNumber, mode, timeRemaining } = get();
    const nextNum = questionNumber + 1;

    let nextTimeRemaining = timeRemaining;
    if (mode === 'millionaire') {
      const step = MILLIONAIRE_STEPS.find((s) => s.questionNumber === nextNum);
      nextTimeRemaining = step?.timeLimit ?? 30;
    }

    set({
      questionNumber: nextNum,
      currentQuestion: null,
      timeRemaining: nextTimeRemaining,
    });
  },

  answerQuestion: (isCorrect, points) => {
    set((state) => ({
      totalAnswered: state.totalAnswered + 1,
      correctAnswers: isCorrect ? state.correctAnswers + 1 : state.correctAnswers,
      score: isCorrect ? state.score + points : state.score,
    }));
  },

  applyScoreBonus: (points) => {
    set((state) => ({
      score: state.score + Math.max(0, points),
    }));
  },

  useJoker: (type) => {
    set((state) => ({
      jokers: state.jokers.map((j) =>
        j.type === type ? { ...j, isUsed: true, isAvailable: false } : j
      ),
    }));
  },

  setTimeRemaining: (time) => {
    set({ timeRemaining: time });
  },

  tickTimer: () => {
    set((state) => ({
      timeRemaining: Math.max(0, state.timeRemaining - 1),
    }));
  },

  updateSafePoint: (points) => {
    set({ safePointReached: points });
  },
}));
