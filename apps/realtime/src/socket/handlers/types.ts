import type { Logger } from 'pino';
import type { RoomManager } from '../../rooms/room-manager.js';
import type { Broadcaster } from '../broadcaster.js';

export type HandlerContext = {
  manager: RoomManager;
  broadcaster: Broadcaster;
  logger: Logger;
};
