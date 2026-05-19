import {
  GUESS_RATE_LIMIT_MS,
  buildSlotsForTrack,
  calculateGuessScore,
  classifyGuess,
  isWithinTieWindow,
  type RoomSettings,
  type Slot,
  type SlotFill,
  type SlotWinner,
} from '@soms/shared';
import type { Logger } from 'pino';
import type { RoundQueueItem } from './preloader.js';

export type RoundInProgress = {
  index: number;
  trackId: string;
  queueItem: RoundQueueItem;
  slots: Slot[];
  fills: SlotFill[];
  startedAt: number;
  durationMs: number;
  endedAt?: number;
};

export type PlayerScore = {
  userId: string;
  totalPoints: number;
  roundPoints: number[];
};

export type GameSession = {
  code: string;
  queue: RoundQueueItem[];
  currentRound?: RoundInProgress;
  completedRounds: RoundInProgress[];
  scores: Map<string, PlayerScore>;
  settings: RoomSettings;
  startedAt: number;
  endedAt?: number;
  /** userId → last guess timestamp (Date.now()). */
  guessRateLimits: Map<string, number>;
};

export type GuessResult =
  | { kind: 'rate_limited' }
  | { kind: 'miss' }
  | {
      kind: 'hit';
      slot: Slot;
      fill: SlotFill;
      points: number;
      isTie: boolean;
      isFirstFill: boolean;
    }
  | { kind: 'too_late'; slot: Slot };

export class GameSessionStore {
  private readonly sessions = new Map<string, GameSession>();
  private readonly logger: Logger;

  constructor(opts: { logger: Logger }) {
    this.logger = opts.logger;
  }

  startSession(opts: {
    code: string;
    queue: RoundQueueItem[];
    settings: RoomSettings;
  }): GameSession {
    const session: GameSession = {
      code: opts.code,
      queue: opts.queue,
      completedRounds: [],
      scores: new Map(),
      settings: opts.settings,
      startedAt: Date.now(),
      guessRateLimits: new Map(),
    };
    this.sessions.set(opts.code, session);
    this.logger.info(
      { code: opts.code, queueLength: opts.queue.length },
      'game session started',
    );
    return session;
  }

  getSession(code: string): GameSession | null {
    return this.sessions.get(code) ?? null;
  }

  endSession(code: string): void {
    if (this.sessions.delete(code)) {
      this.logger.info({ code }, 'game session ended');
    }
  }

  getAllSessions(): GameSession[] {
    return Array.from(this.sessions.values());
  }

  initializePlayerScore(code: string, userId: string): void {
    const session = this.sessions.get(code);
    if (!session) return;
    if (session.scores.has(userId)) return;
    session.scores.set(userId, { userId, totalPoints: 0, roundPoints: [] });
  }

  updateScore(code: string, userId: string, points: number): void {
    const session = this.sessions.get(code);
    if (!session) return;
    let score = session.scores.get(userId);
    if (!score) {
      score = { userId, totalPoints: 0, roundPoints: [] };
      session.scores.set(userId, score);
    }
    score.totalPoints += points;
    const idx = session.completedRounds.length;
    while (score.roundPoints.length <= idx) score.roundPoints.push(0);
    score.roundPoints[idx] = (score.roundPoints[idx] ?? 0) + points;
  }

  startRound(
    code: string,
    roundIndex: number,
    durationMs: number,
  ): RoundInProgress | null {
    const session = this.sessions.get(code);
    if (!session) return null;
    const item = session.queue[roundIndex];
    if (!item) return null;

    const round: RoundInProgress = {
      index: roundIndex,
      trackId: item.trackId,
      queueItem: item,
      slots: buildSlotsForTrack({ title: item.title, artists: item.artists }),
      fills: [],
      startedAt: Date.now(),
      durationMs,
    };
    session.currentRound = round;
    session.guessRateLimits.clear();
    this.logger.info(
      { code, roundIndex, slots: round.slots.length },
      'round started',
    );
    return round;
  }

  endCurrentRound(code: string): RoundInProgress | null {
    const session = this.sessions.get(code);
    if (!session?.currentRound) return null;
    const round = session.currentRound;
    round.endedAt = Date.now();
    session.completedRounds.push(round);
    session.currentRound = undefined;
    this.logger.info({ code, roundIndex: round.index }, 'round ended');
    return round;
  }

  /**
   * Núcleo da regra de jogo. Server-authoritative.
   *
   * Rate limit por userId (400ms). Classifica guess contra slots ainda
   * "abertos" (não preenchidos OU dentro da janela de empate). Pontua via
   * calculateGuessScore. Mesmo userId não ganha 2x o mesmo slot.
   */
  recordGuess(
    code: string,
    userId: string,
    guess: string,
    tIntoRoundMs: number,
  ): GuessResult {
    const session = this.sessions.get(code);
    if (!session?.currentRound) return { kind: 'miss' };
    const round = session.currentRound;

    const now = Date.now();
    const lastGuessAt = session.guessRateLimits.get(userId) ?? 0;
    if (now - lastGuessAt < GUESS_RATE_LIMIT_MS) {
      return { kind: 'rate_limited' };
    }
    session.guessRateLimits.set(userId, now);

    // Classifica contra TODOS os slots — too_late é detectado abaixo
    const matched = classifyGuess(guess, round.slots);
    if (!matched) return { kind: 'miss' };

    const existingFill = round.fills.find((f) => f.slotKind === matched.slot.kind);

    if (!existingFill) {
      const points = calculateGuessScore({
        slot: matched.slot,
        tIntoRoundMs,
        durationMs: round.durationMs,
        isTie: false,
      });
      const winner: SlotWinner = {
        userId,
        tIntoRoundMs,
        pointsAwarded: points,
      };
      const fill: SlotFill = {
        slotKind: matched.slot.kind,
        winners: [winner],
        filledAt: tIntoRoundMs,
      };
      round.fills.push(fill);
      this.updateScore(code, userId, points);
      return {
        kind: 'hit',
        slot: matched.slot,
        fill,
        points,
        isTie: false,
        isFirstFill: true,
      };
    }

    // Slot já tem fill. Dentro da janela de empate?
    if (isWithinTieWindow(tIntoRoundMs, existingFill.filledAt)) {
      // Mesmo userId não ganha 2x o mesmo slot
      if (existingFill.winners.some((w) => w.userId === userId)) {
        return { kind: 'miss' };
      }
      const points = calculateGuessScore({
        slot: matched.slot,
        tIntoRoundMs,
        durationMs: round.durationMs,
        isTie: true,
      });
      const winner: SlotWinner = { userId, tIntoRoundMs, pointsAwarded: points };
      existingFill.winners.push(winner);
      this.updateScore(code, userId, points);
      return {
        kind: 'hit',
        slot: matched.slot,
        fill: existingFill,
        points,
        isTie: true,
        isFirstFill: false,
      };
    }

    // Fora da janela — chegou tarde
    return { kind: 'too_late', slot: matched.slot };
  }
}
