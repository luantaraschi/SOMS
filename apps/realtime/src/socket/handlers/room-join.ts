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
    // Idempotent rejoin: mesmo socket/user já conectado na sala alvo.
    // Evita efeito colateral do guard de membership (caso 3) no fluxo
    // legítimo room:create -> navegação -> room:join do mesmo code.
    const targetRoom = ctx.manager.getRoom(payload.code);
    if (targetRoom) {
      const existing = targetRoom.players.get(socket.data.userId);
      if (existing && existing.isConnected) {
        socket.data.currentRoomCode = payload.code;
        void socket.join(roomChannel(payload.code));
        ack({
          ok: true,
          snapshot: buildRoomSnapshot(targetRoom, socket.data.userId),
        });
        return;
      }
    }

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
