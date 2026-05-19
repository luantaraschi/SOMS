import type { TypedSocket } from '../types.js';
import type { HandlerContext } from './types.js';

export function registerGameGuessHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('game:guess', (payload) => {
    const code = socket.data.currentRoomCode;
    if (code === null) {
      socket.emit('error', { code: 'NOT_IN_ROOM', message: 'você não está em uma sala.' });
      return;
    }

    const room = ctx.manager.getRoom(code);
    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'sala não encontrada.' });
      return;
    }

    if (room.status !== 'playing') {
      socket.emit('error', {
        code: 'INVALID_STATUS_TRANSITION',
        message: 'guess fora de hora.',
      });
      return;
    }

    // Stub B3: ainda sem scoring. Log e retorna miss privado.
    ctx.logger.info(
      { code, userId: socket.data.userId, text: payload.text },
      'guess received (stub)',
    );
    socket.emit('game:guess:accepted', { outcome: { kind: 'miss' } });
  });
}
