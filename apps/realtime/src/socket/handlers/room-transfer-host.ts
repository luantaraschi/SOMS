import { mapRoomErrorToServerError } from '../error-mapping.js';
import type { TypedSocket } from '../types.js';
import type { HandlerContext } from './types.js';

export function registerRoomTransferHostHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('room:transfer_host', (payload, ack) => {
    const code = socket.data.currentRoomCode;
    if (code === null) {
      ack({
        ok: false,
        error: { code: 'NOT_IN_ROOM', message: 'você não está em uma sala.' },
      });
      return;
    }

    const result = ctx.manager.transferHost(
      code,
      socket.data.userId,
      payload.newHostUserId,
    );
    if (!result.ok) {
      ack({ ok: false, error: mapRoomErrorToServerError(result.error) });
      return;
    }
    ack({ ok: true });
  });
}
