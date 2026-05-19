import type { TypedSocket } from '../types.js';
import type { HandlerContext } from './types.js';

export function registerRoomReturnToLobbyHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('room:return_to_lobby', (ack) => {
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
        error: { code: 'NOT_HOST', message: 'só o host pode voltar pra sala.' },
      });
      return;
    }
    if (room.status !== 'ended') {
      ack({
        ok: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: 'só dá pra voltar pra sala depois que a partida terminar.',
          details: { from: room.status, to: 'lobby' },
        },
      });
      return;
    }

    const result = ctx.manager.transitionTo(code, socket.data.userId, 'lobby');
    if (!result.ok) {
      ack({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'não consegui voltar pra sala.',
          details: { transitionError: result.error.code },
        },
      });
      return;
    }

    // Limpa sessão de jogo e timers — partida terminou, próxima começa do zero.
    ctx.gameSessionStore.endSession(code);
    ctx.roundRunner.cleanupRoom(code);
    ack({ ok: true });
  });
}
