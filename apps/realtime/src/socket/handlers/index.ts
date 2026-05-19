import type { TypedSocket } from '../types.js';
import { registerGameGuessHandler } from './game-guess.js';
import { registerGameReadyNextHandler } from './game-ready-next.js';
import { registerGameStartHandler } from './game-start.js';
import { registerPingHandler } from './ping.js';
import { registerRoomCreateHandler } from './room-create.js';
import { registerRoomJoinHandler } from './room-join.js';
import { registerRoomKickHandler } from './room-kick.js';
import { registerRoomLeaveHandler } from './room-leave.js';
import { registerRoomReturnToLobbyHandler } from './room-return-to-lobby.js';
import { registerRoomSettingsUpdateHandler } from './room-settings-update.js';
import { registerRoomTransferHostHandler } from './room-transfer-host.js';
import type { HandlerContext } from './types.js';

export function registerAllHandlers(socket: TypedSocket, ctx: HandlerContext): void {
  registerPingHandler(socket);
  registerRoomCreateHandler(socket, ctx);
  registerRoomJoinHandler(socket, ctx);
  registerRoomLeaveHandler(socket, ctx);
  registerRoomKickHandler(socket, ctx);
  registerRoomTransferHostHandler(socket, ctx);
  registerRoomSettingsUpdateHandler(socket, ctx);
  registerRoomReturnToLobbyHandler(socket, ctx);
  registerGameStartHandler(socket, ctx);
  registerGameGuessHandler(socket, ctx);
  registerGameReadyNextHandler(socket, ctx);
}

export type { HandlerContext } from './types.js';
