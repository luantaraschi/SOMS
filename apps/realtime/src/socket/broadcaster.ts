import type { Logger } from 'pino';
import type { RoomManagerEvents } from '../rooms/types.js';
import { toPlayerSnapshot } from './snapshot.js';
import type { TypedServer } from './types.js';

const ROOM_PREFIX = 'room:';
const USER_PREFIX = 'user:';

export function roomChannel(code: string): string {
  return `${ROOM_PREFIX}${code}`;
}

export function userChannel(userId: string): string {
  return `${USER_PREFIX}${userId}`;
}

/**
 * Adapter que conecta os callbacks do `RoomManager` aos broadcasts Socket.IO.
 * Cada callback emite eventos tipados pro canal `room:${code}` (todos os
 * sockets que deram `socket.join(roomChannel(code))`).
 *
 * Também expõe helpers de side-effect: força um userId a sair do canal
 * (`leaveRoomChannel`), desconecta sockets (`disconnectUser`).
 */
export class Broadcaster {
  constructor(
    private readonly io: TypedServer,
    private readonly logger: Logger,
  ) {}

  asRoomManagerEvents(): RoomManagerEvents {
    return {
      onPlayerJoined: (room, player) => {
        this.io
          .to(roomChannel(room.code))
          .emit('room:player:joined', { player: toPlayerSnapshot(player) });
      },
      onPlayerLeft: (room, player, reason) => {
        this.io
          .to(roomChannel(room.code))
          .emit('room:player:left', { userId: player.userId, reason });
      },
      onPlayerDisconnected: (room, player) => {
        this.io
          .to(roomChannel(room.code))
          .emit('room:player:disconnected', { userId: player.userId });
      },
      onPlayerReconnected: (room, player) => {
        this.io
          .to(roomChannel(room.code))
          .emit('room:player:reconnected', { userId: player.userId });
      },
      onHostChanged: (room, oldHostUserId, newHostUserId, reason) => {
        this.io
          .to(roomChannel(room.code))
          .emit('room:host:changed', { oldHostUserId, newHostUserId, reason });
      },
      onStatusChanged: (room, from, to) => {
        this.io.to(roomChannel(room.code)).emit('room:status:changed', { from, to });
      },
      onRoomAbandoned: (room) => {
        this.logger.info({ code: room.code }, 'broadcaster: room abandoned');
      },
      onRoomDestroyed: (code) => {
        this.io.to(roomChannel(code)).emit('room:destroyed', { code });
        // Após broadcast, força todos os sockets a saírem do canal.
        // (channel já vai morrer porque ninguém escuta, mas limpa estado.)
        void this.io.in(roomChannel(code)).socketsLeave(roomChannel(code));
      },
      onRoomCreated: (room) => {
        this.logger.info({ code: room.code }, 'broadcaster: room created');
      },
    };
  }

  /**
   * Faz todos os sockets de `userId` saírem do canal da sala e limpa
   * `socket.data.currentRoomCode`. Usado quando o player é kickado.
   */
  async leaveRoomChannel(userId: string, code: string): Promise<void> {
    const sockets = await this.io.in(userChannel(userId)).fetchSockets();
    for (const s of sockets) {
      s.data.currentRoomCode = null;
      void s.leave(roomChannel(code));
    }
  }
}
