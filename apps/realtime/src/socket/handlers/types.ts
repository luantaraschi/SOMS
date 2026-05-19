import type { Logger } from 'pino';
import type { RoundRunner } from '../../game/round-runner.js';
import type { GameSessionStore } from '../../game/session-store.js';
import type { RoomManager } from '../../rooms/room-manager.js';
import type { Broadcaster } from '../broadcaster.js';

export type HandlerContext = {
  manager: RoomManager;
  broadcaster: Broadcaster;
  gameSessionStore: GameSessionStore;
  roundRunner: RoundRunner;
  logger: Logger;
};
