import { roomChannel } from '../broadcaster.js';
import { mapRoomErrorToServerError } from '../error-mapping.js';
import { buildRoomSnapshot } from '../snapshot.js';
import type { TypedSocket } from '../types.js';
import { ensureNotInAnotherRoom } from './_membership.js';
import type { HandlerContext } from './types.js';

const ALREADY_IN_ROOM_ERR = {
  code: 'PLAYER_ALREADY_IN_ROOM' as const,
  message: 'você já está em outra sala. saia primeiro.',
};

export function registerRoomJoinHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('room:join', (payload, ack) => {
    const guard = ensureNotInAnotherRoom(socket, ctx.manager);
    if (guard === 'blocked') {
      ack({ ok: false, error: ALREADY_IN_ROOM_ERR });
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
