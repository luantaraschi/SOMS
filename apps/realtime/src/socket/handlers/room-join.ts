import { mapRoomErrorToServerError } from '../error-mapping.js';
import { roomChannel } from '../broadcaster.js';
import { buildRoomSnapshot } from '../snapshot.js';
import type { TypedSocket } from '../types.js';
import type { HandlerContext } from './types.js';

export function registerRoomJoinHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('room:join', (payload, ack) => {
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

    const result = ctx.manager.joinRoom({
      code: payload.code,
      userId: socket.data.userId,
      nickname: socket.data.nickname,
    });

    if (!result.ok) {
      ack({ ok: false, error: mapRoomErrorToServerError(result.error) });
      return;
    }

    socket.data.currentRoomCode = result.room.code;
    void socket.join(roomChannel(result.room.code));

    ack({
      ok: true,
      snapshot: buildRoomSnapshot(result.room, socket.data.userId),
    });
  });
}
