import type { TypedSocket } from '../types.js';
import type { HandlerContext } from './types.js';

export function registerGameReadyNextHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('game:ready_next_round', (ack) => {
    const code = socket.data.currentRoomCode;
    if (code === null) {
      ack({
        ok: false,
        error: { code: 'NOT_IN_ROOM', message: 'você não está em uma sala.' },
      });
      return;
    }

    const room = ctx.manager.getRoom(code);
    if (!room) {
      ack({
        ok: false,
        error: { code: 'ROOM_NOT_FOUND', message: 'sala não encontrada.' },
      });
      return;
    }
    if (room.hostUserId !== socket.data.userId) {
      ack({
        ok: false,
        error: { code: 'NOT_HOST', message: 'só o host pode fazer isso.' },
      });
      return;
    }
    if (room.status !== 'reveal') {
      ack({
        ok: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: 'só dá pra ir pro próximo round durante o reveal.',
        },
      });
      return;
    }

    // Stub B3: aceita e loga. Game loop real (B4) consome esse sinal.
    ctx.logger.info({ code, userId: socket.data.userId }, 'ready_next_round (stub)');
    ack({ ok: true });
  });
}
