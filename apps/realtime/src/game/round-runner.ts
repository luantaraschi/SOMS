import {
  COUNTDOWN_MS,
  REVEAL_DURATION_MS,
  ROUND_DURATION_MS,
  getActivePlayers,
  shouldEndRound,
} from '@soms/shared';
import type { Logger } from 'pino';
import type { RoomManager } from '../rooms/room-manager.js';
import type { Broadcaster } from '../socket/broadcaster.js';
import type { GameSessionStore } from './session-store.js';

const EARLY_CHECK_INTERVAL_MS_DEFAULT = 500;

export type RoundRunnerConfig = {
  countdownMs: number;
  roundDurationMs: number;
  revealDurationMs: number;
  earlyCheckIntervalMs: number;
};

export const DEFAULT_RUNNER_CONFIG: RoundRunnerConfig = {
  countdownMs: COUNTDOWN_MS,
  roundDurationMs: ROUND_DURATION_MS,
  revealDurationMs: REVEAL_DURATION_MS,
  earlyCheckIntervalMs: EARLY_CHECK_INTERVAL_MS_DEFAULT,
};

export type GameEndedHook = (code: string) => Promise<void>;

/**
 * Orquestra timers e transições de uma partida em curso.
 *
 * State machine:
 *   countdown → playing → reveal → countdown (próximo round) | ended (último)
 *
 * Durações injetáveis via `config` pra testes não esperarem 30s.
 */
export class RoundRunner {
  private readonly timers = new Map<string, Set<NodeJS.Timeout>>();
  private readonly config: RoundRunnerConfig;

  constructor(
    private readonly gameStore: GameSessionStore,
    private readonly manager: RoomManager,
    private readonly broadcaster: Broadcaster,
    private readonly logger: Logger,
    private readonly onGameEnded: GameEndedHook,
    config: Partial<RoundRunnerConfig> = {},
  ) {
    this.config = { ...DEFAULT_RUNNER_CONFIG, ...config };
  }

  /**
   * Inicia a partida — chamado por game-start handler logo após
   * `transitionTo(code, hostUserId, 'countdown')`.
   *
   * Inicializa scores pra todos os players atualmente na sala, depois agenda
   * o primeiro round.
   */
  startGame(code: string): void {
    const room = this.manager.getRoom(code);
    const session = this.gameStore.getSession(code);
    if (!room || !session) {
      this.logger.warn({ code }, 'startGame: room or session missing');
      return;
    }
    for (const player of room.players.values()) {
      this.gameStore.initializePlayerScore(code, player.userId);
    }

    // Emit countdown event com timestamp absoluto
    this.broadcaster.toRoom(code).emit('game:countdown', {
      secondsLeft: Math.floor(this.config.countdownMs / 1000),
      startsAt: Date.now() + this.config.countdownMs,
    });

    this.schedule(code, this.config.countdownMs, () => this.startRound(code));
  }

  /**
   * Avança pro próximo round ou encerra a partida. Chamado por
   * game:ready_next_round (host) OU automaticamente após REVEAL_DURATION_MS.
   */
  advanceToNextRound(code: string): { ok: boolean; reason?: string } {
    const session = this.gameStore.getSession(code);
    if (!session) return { ok: false, reason: 'no session' };
    const room = this.manager.getRoom(code);
    if (!room) return { ok: false, reason: 'no room' };
    if (room.status !== 'reveal') return { ok: false, reason: 'not in reveal' };

    const nextIndex = session.completedRounds.length;
    if (nextIndex >= session.queue.length) {
      this.endGame(code);
      return { ok: true };
    }

    this.clearTimers(code);
    // Volta pra countdown via system (reveal → countdown está em SYSTEM_TRANSITIONS)
    this.manager.systemTransition(code, 'countdown');
    this.broadcaster.toRoom(code).emit('game:countdown', {
      secondsLeft: Math.floor(this.config.countdownMs / 1000),
      startsAt: Date.now() + this.config.countdownMs,
    });
    this.schedule(code, this.config.countdownMs, () => this.startRound(code));
    return { ok: true };
  }

  private startRound(code: string): void {
    const session = this.gameStore.getSession(code);
    const room = this.manager.getRoom(code);
    if (!session || !room) return;

    const roundIndex = session.completedRounds.length;
    const round = this.gameStore.startRound(code, roundIndex, this.config.roundDurationMs);
    if (!round) {
      this.logger.error({ code, roundIndex }, 'startRound failed');
      return;
    }

    this.manager.systemTransition(code, 'playing');

    this.logger.info(
      {
        code,
        roundIndex,
        trackId: round.queueItem.trackId,
        title: round.queueItem.title,
        previewUrl: round.queueItem.freshPreviewUrl,
      },
      'shipping round to clients',
    );

    this.broadcaster.toRoom(code).emit('game:round:started', {
      roundIndex,
      totalRounds: session.queue.length,
      startedAt: round.startedAt,
      durationMs: round.durationMs,
      previewUrl: round.queueItem.freshPreviewUrl,
      slots: round.slots.map((s) => ({ kind: s.kind, basePoints: s.basePoints })),
      decade: round.queueItem.decade,
    });

    // Timeout de fim natural
    this.schedule(code, round.durationMs, () => this.endRound(code, 'timeout'));

    // Tick pra encerramento antecipado
    const interval = setInterval(
      () => this.checkEarlyEnd(code),
      this.config.earlyCheckIntervalMs,
    );
    this.trackInterval(code, interval);
  }

  private checkEarlyEnd(code: string): void {
    const session = this.gameStore.getSession(code);
    const room = this.manager.getRoom(code);
    if (!session?.currentRound || !room || room.status !== 'playing') return;

    const activePlayers = Array.from(room.players.values()).map((p) => ({
      userId: p.userId,
      isConnected: p.isConnected,
      ...(p.disconnectedAt !== undefined && { lastDisconnectAt: p.disconnectedAt }),
    }));

    if (
      shouldEndRound(
        {
          trackId: session.currentRound.trackId,
          slots: session.currentRound.slots,
          fills: session.currentRound.fills,
          startedAt: session.currentRound.startedAt,
          durationMs: session.currentRound.durationMs,
        },
        getActivePlayers(activePlayers),
      )
    ) {
      this.endRound(code, 'early');
    }
  }

  private endRound(code: string, reason: 'timeout' | 'early'): void {
    const session = this.gameStore.getSession(code);
    const room = this.manager.getRoom(code);
    if (!session?.currentRound || !room || room.status !== 'playing') return;

    this.clearTimers(code);
    const round = this.gameStore.endCurrentRound(code);
    if (!round) return;

    this.manager.systemTransition(code, 'reveal');

    this.broadcaster.toRoom(code).emit('game:round:reveal', {
      roundIndex: round.index,
      track: {
        title: round.queueItem.title,
        artists: round.queueItem.artists,
        album: null,
        coverUrl: round.queueItem.coverUrl || null,
        releaseYear: null,
      },
      fills: round.fills.map((f) => {
        const slot = round.slots.find((s) => s.kind === f.slotKind);
        return {
          kind: f.slotKind,
          display: slot?.display ?? '',
          winners: f.winners.map((w) => ({
            userId: w.userId,
            nickname: room.players.get(w.userId)?.nickname ?? '',
            pointsAwarded: w.pointsAwarded,
            tIntoRoundMs: w.tIntoRoundMs,
          })),
        };
      }),
      scoresSnapshot: Array.from(session.scores.values()).map((s) => ({
        userId: s.userId,
        totalPoints: s.totalPoints,
      })),
      endedReason: reason,
    });

    // Auto-advance após REVEAL_DURATION_MS se host não pular antes
    this.schedule(code, this.config.revealDurationMs, () => {
      const r = this.manager.getRoom(code);
      if (r?.status === 'reveal') {
        this.advanceToNextRound(code);
      }
    });
  }

  private endGame(code: string): void {
    const session = this.gameStore.getSession(code);
    const room = this.manager.getRoom(code);
    if (!session || !room) return;

    this.clearTimers(code);
    // reveal → ended está em SYSTEM_TRANSITIONS
    if (room.status === 'reveal') {
      this.manager.systemTransition(code, 'ended');
    }
    session.endedAt = Date.now();

    const ranking = Array.from(session.scores.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((s, idx) => ({
        userId: s.userId,
        totalPoints: s.totalPoints,
        position: idx + 1,
      }));

    this.broadcaster.toRoom(code).emit('game:ended', {
      ranking,
      totalRounds: session.queue.length,
      durationMs: session.endedAt - session.startedAt,
    });

    // Persistência fire-and-forget
    void this.onGameEnded(code).catch((err: unknown) => {
      this.logger.error({ err, code }, 'persist game failed');
    });
  }

  /** Chamado quando sala destrói antes do fim natural — limpa timers. */
  cleanupRoom(code: string): void {
    this.clearTimers(code);
  }

  cleanupAll(): void {
    for (const code of this.timers.keys()) this.clearTimers(code);
  }

  private schedule(code: string, ms: number, fn: () => void): void {
    const timer = setTimeout(() => {
      this.timers.get(code)?.delete(timer);
      try {
        fn();
      } catch (err) {
        this.logger.error({ err, code }, 'timer callback threw');
      }
    }, ms);
    let set = this.timers.get(code);
    if (!set) {
      set = new Set();
      this.timers.set(code, set);
    }
    set.add(timer);
  }

  private trackInterval(code: string, interval: NodeJS.Timeout): void {
    let set = this.timers.get(code);
    if (!set) {
      set = new Set();
      this.timers.set(code, set);
    }
    set.add(interval);
  }

  private clearTimers(code: string): void {
    const set = this.timers.get(code);
    if (!set) return;
    for (const t of set) {
      clearTimeout(t);
      clearInterval(t);
    }
    set.clear();
  }
}
