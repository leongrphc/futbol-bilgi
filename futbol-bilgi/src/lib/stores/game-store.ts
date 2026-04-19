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

function createDefaultJokers(): JokerState[] {
  return [
    { type: 'fifty_fifty', isUsed: false, isAvailable: true },
    { type: 'audience', isUsed: false, isAvailable: true },
    { type: 'phone', isUsed: false, isAvailable: true },
    { type: 'freeze_time', isUsed: false, isAvailable: true },
    { type: 'skip', isUsed: false, isAvailable: true },
    { type: 'double_answer', isUsed: false, isAvailable: true },
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
  startGame: (mode: GameMode, leagueScope: LeagueScope, sessionId: string) => void;
  endGame: (result: GameResult, xp: number, coins: number) => void;
  resetGame: () => void;

  // Question flow
  setCurrentQuestion: (question: Question) => void;
  nextQuestion: () => void;
  answerQuestion: (isCorrect: boolean, points: number) => void;

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

  startGame: (mode, leagueScope, sessionId) => {
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
      jokers: mode === 'millionaire' ? createDefaultJokers() : [],
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
    const { questionNumber, mode } = get();
    const nextNum = questionNumber + 1;

    // Get time limit for the next question
    let timeLimit = 30;
    if (mode === 'millionaire') {
      const step = MILLIONAIRE_STEPS.find((s) => s.questionNumber === nextNum);
      timeLimit = step?.timeLimit ?? 30;
    }

    set({
      questionNumber: nextNum,
      currentQuestion: null,
      timeRemaining: timeLimit,
    });
  },

  answerQuestion: (isCorrect, points) => {
    set((state) => ({
      totalAnswered: state.totalAnswered + 1,
      correctAnswers: isCorrect ? state.correctAnswers + 1 : state.correctAnswers,
      score: isCorrect ? state.score + points : state.score,
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
