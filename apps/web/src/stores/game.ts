import type {
  CurrentRoundSnapshot,
  GameEndedEvent,
  GameGuessPublicEvent,
  GameRoundRevealEvent,
  GameRoundStartedEvent,
  GameSlotFilledEvent,
  GameStateSnapshot,
  SlotFillPublic,
  SlotKind,
} from '@soms/shared';
import { create } from 'zustand';

/**
 * Fases da UI de jogo. Mapeamento dos status do server:
 *   idle       — pré-partida ou pós-cleanup
 *   preparing  — server emitiu game:preparing (pre-load Deezer em curso)
 *   countdown  — game:countdown disparou (3…2…1)
 *   playing    — game:round:started, áudio rolando
 *   reveal     — game:round:reveal entre rounds
 *   ended      — game:ended (pódio)
 */
export type GamePhase =
  | 'idle'
  | 'preparing'
  | 'countdown'
  | 'playing'
  | 'reveal'
  | 'ended';

export type FeedOutcome = 'hit' | 'miss' | 'too_late';

export type FeedEntry = {
  /** `${userId}-${timestamp}` — chave estável pra React keys. */
  id: string;
  userId: string;
  nickname: string;
  text: string;
  outcome: FeedOutcome;
  slotKind?: SlotKind;
  isTie?: boolean;
  timestamp: number;
};

export type CurrentRoundState = {
  index: number;
  totalRounds: number;
  startedAt: number;
  durationMs: number;
  previewUrl: string;
  slots: { kind: SlotKind; basePoints: number }[];
  decade: number;
  filledSlots: SlotFillPublic[];
};

export type PlayerScoreState = {
  userId: string;
  totalPoints: number;
};

/** Status do "meu jogo" no round corrente. Visual no input depende disso. */
export type MyRoundOutcome = 'idle' | 'playing' | 'all_slots_taken';

const FEED_MAX = 50;

type GameStore = {
  phase: GamePhase;
  /** Timestamp absoluto em que o round vai começar (após countdown). */
  countdownEndsAt: number | null;
  currentRound: CurrentRoundState | null;
  feed: FeedEntry[];
  /** Map userId → score state. */
  scores: Map<string, PlayerScoreState>;
  lastReveal: GameRoundRevealEvent | null;
  finalResults: GameEndedEvent | null;
  myOutcomeForCurrentRound: MyRoundOutcome;

  // Actions
  setPreparing: () => void;
  setCountdown: (endsAt: number) => void;
  startRound: (payload: GameRoundStartedEvent) => void;
  addSlotFill: (payload: GameSlotFilledEvent) => void;
  addFeedEntry: (payload: GameGuessPublicEvent) => void;
  setReveal: (payload: GameRoundRevealEvent) => void;
  setEnded: (payload: GameEndedEvent) => void;
  updateScore: (userId: string, totalPoints: number) => void;
  setMyOutcome: (outcome: MyRoundOutcome) => void;
  hydrateFromSnapshot: (snapshot: GameStateSnapshot) => void;
  reset: () => void;
};

function fromCurrentSnapshot(snapshot: CurrentRoundSnapshot): CurrentRoundState {
  return {
    index: snapshot.index,
    totalRounds: snapshot.totalRounds,
    startedAt: snapshot.startedAt,
    durationMs: snapshot.durationMs,
    previewUrl: snapshot.previewUrl,
    slots: snapshot.slots,
    decade: snapshot.decade,
    filledSlots: snapshot.fills,
  };
}

export const useGame = create<GameStore>((set) => ({
  phase: 'idle',
  countdownEndsAt: null,
  currentRound: null,
  feed: [],
  scores: new Map(),
  lastReveal: null,
  finalResults: null,
  myOutcomeForCurrentRound: 'idle',

  setPreparing: () => set({ phase: 'preparing' }),

  setCountdown: (endsAt) =>
    set({
      phase: 'countdown',
      countdownEndsAt: endsAt,
    }),

  startRound: (payload) =>
    set({
      phase: 'playing',
      countdownEndsAt: null,
      lastReveal: null,
      currentRound: {
        index: payload.roundIndex,
        totalRounds: payload.totalRounds,
        startedAt: payload.startedAt,
        durationMs: payload.durationMs,
        previewUrl: payload.previewUrl,
        slots: payload.slots,
        decade: payload.decade,
        filledSlots: [],
      },
      myOutcomeForCurrentRound: 'playing',
    }),

  addSlotFill: (payload) =>
    set((state) => {
      if (!state.currentRound) return state;
      // Server pode mandar update do mesmo slotKind (empate dentro da tie window).
      // Reemplaza qualquer fill antigo do mesmo kind.
      const without = state.currentRound.filledSlots.filter(
        (f) => f.kind !== payload.slotKind,
      );
      const newFill: SlotFillPublic = {
        kind: payload.slotKind,
        display: '', // só revelado em game:round:reveal
        winners: payload.winners.map((w) => ({
          userId: w.userId,
          nickname: '', // resolvido via store de room na renderização
          pointsAwarded: w.points,
          tIntoRoundMs: 0,
        })),
      };
      return {
        currentRound: {
          ...state.currentRound,
          filledSlots: [...without, newFill],
        },
      };
    }),

  addFeedEntry: (payload) =>
    set((state) => {
      const entry: FeedEntry = {
        id: `${payload.userId}-${payload.timestamp}`,
        userId: payload.userId,
        nickname: payload.nickname,
        text: payload.text,
        outcome: payload.outcome,
        ...(payload.slotKind !== undefined ? { slotKind: payload.slotKind } : {}),
        ...(payload.isTie !== undefined ? { isTie: payload.isTie } : {}),
        timestamp: payload.timestamp,
      };
      return { feed: [entry, ...state.feed].slice(0, FEED_MAX) };
    }),

  setReveal: (payload) =>
    set({
      phase: 'reveal',
      lastReveal: payload,
    }),

  setEnded: (payload) =>
    set({
      phase: 'ended',
      finalResults: payload,
    }),

  updateScore: (userId, totalPoints) =>
    set((state) => {
      const newScores = new Map(state.scores);
      newScores.set(userId, { userId, totalPoints });
      return { scores: newScores };
    }),

  setMyOutcome: (outcome) => set({ myOutcomeForCurrentRound: outcome }),

  hydrateFromSnapshot: (snapshot) =>
    set(() => {
      const scores = new Map<string, PlayerScoreState>(
        snapshot.scores.map((s) => [
          s.userId,
          { userId: s.userId, totalPoints: s.totalPoints },
        ]),
      );
      const currentRound = snapshot.currentRound
        ? fromCurrentSnapshot(snapshot.currentRound)
        : null;
      const lastReveal = snapshot.lastReveal
        ? ({
            roundIndex: snapshot.lastReveal.roundIndex,
            track: snapshot.lastReveal.track,
            fills: snapshot.lastReveal.fills,
            scoresSnapshot: snapshot.scores.map((s) => ({
              userId: s.userId,
              totalPoints: s.totalPoints,
            })),
            endedReason: 'timeout' as const,
          } satisfies GameRoundRevealEvent)
        : null;
      const phase: GamePhase = currentRound
        ? 'playing'
        : lastReveal
          ? 'reveal'
          : 'idle';
      return {
        phase,
        currentRound,
        lastReveal,
        scores,
      };
    }),

  reset: () =>
    set({
      phase: 'idle',
      countdownEndsAt: null,
      currentRound: null,
      feed: [],
      scores: new Map(),
      lastReveal: null,
      finalResults: null,
      myOutcomeForCurrentRound: 'idle',
    }),
}));
