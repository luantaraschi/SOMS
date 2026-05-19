import { mapRoomErrorToServerError } from '../error-mapping.js';
import type { TypedSocket } from '../types.js';
import type { HandlerContext } from './types.js';

export function registerGameStartHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('game:start', (ack) => {
    const code = socket.data.currentRoomCode;
    if (code === null) {
      ack({
        ok: false,
        error: { code: 'NOT_IN_ROOM', message: 'você não está em uma sala.' },
      });
      return;
    }

    // Stub Sprint 1 / B3: só transiciona lobby → countdown.
    // O game loop real (pre-load + countdown + rounds) vem em B4/B5.
    const result = ctx.manager.transitionTo(code, socket.data.userId, 'countdown');
    if (!result.ok) {
      ack({ ok: false, error: mapRoomErrorToServerError(result.error) });
      return;
    }
    ack({ ok: true });
  });
}
