import { buildRoomSnapshot } from '../snapshot.js';
import { roomChannel } from '../broadcaster.js';
import type { TypedSocket } from '../types.js';
import type { HandlerContext } from './types.js';

export function registerRoomCreateHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('room:create', (payload, ack) => {
    if (socket.data.currentRoomCode !== null) {
      ack({
        ok: false,
        error: {
          code: 'PLAYER_ALREADY_IN_ROOM',
          message: 'você já está em outra sala. saia primeiro.',
        },
      });
      return;
    }

    const result = ctx.manager.createRoom({
      hostUserId: socket.data.userId,
      hostNickname: socket.data.nickname,
      settings: payload.settings,
    });

    if (!result.ok) {
      // mapeamento inline porque só NICKNAME_INVALID pode acontecer aqui
      ack({
        ok: false,
        error: {
          code: 'NICKNAME_INVALID',
          message: 'apelido inválido.',
        },
      });
      return;
    }

    socket.data.currentRoomCode = result.room.code;
    void socket.join(roomChannel(result.room.code));

    ack({
      ok: true,
      code: result.room.code,
      snapshot: buildRoomSnapshot(result.room, socket.data.userId),
    });
  });
}
