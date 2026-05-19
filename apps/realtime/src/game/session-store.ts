import type { RoomSettings } from '@soms/shared';
import type { Logger } from 'pino';
import type { RoundQueueItem } from './preloader.js';

export type GameSession = {
  code: string;
  queue: RoundQueueItem[];
  currentRoundIndex: number;
  settings: RoomSettings;
  startedAt: number;
};

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
      currentRoundIndex: 0,
      settings: opts.settings,
      startedAt: Date.now(),
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
}
