import { roomChannel } from '../broadcaster.js';
import { buildRoomSnapshot } from '../snapshot.js';
import type { TypedSocket } from '../types.js';
import { ensureNotInAnotherRoom } from './_membership.js';
import type { HandlerContext } from './types.js';

const ALREADY_IN_ROOM_ERR = {
  code: 'PLAYER_ALREADY_IN_ROOM' as const,
  message: 'você já está em outra sala. saia primeiro.',
};

export function registerRoomCreateHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('room:create', (payload, ack) => {
    const guard = ensureNotInAnotherRoom(socket, ctx.manager);
    if (guard === 'blocked') {
      ack({ ok: false, error: ALREADY_IN_ROOM_ERR });
      return;
    }

    const result = ctx.manager.createRoom({
      hostUserId: socket.data.userId,
      hostNickname: socket.data.nickname,
      settings: payload.settings,
    });

    if (!result.ok) {
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
