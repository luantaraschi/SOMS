import type { GuessOutcome } from '@soms/shared';
import type { TypedSocket } from '../types.js';
import type { HandlerContext } from './types.js';

export function registerGameGuessHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('game:guess', (payload) => {
    const code = socket.data.currentRoomCode;
    if (code === null) {
      socket.emit('error', {
        code: 'NOT_IN_ROOM',
        message: 'você não está em uma sala.',
      });
      return;
    }

    const room = ctx.manager.getRoom(code);
    if (!room) return;
    if (room.status !== 'playing') {
      socket.emit('error', {
        code: 'INVALID_STATUS_TRANSITION',
        message: 'guess fora de hora.',
        details: { status: room.status },
      });
      return;
    }

    const session = ctx.gameSessionStore.getSession(code);
    if (!session?.currentRound) return;

    const tIntoRoundMs = Date.now() - session.currentRound.startedAt;
    const result = ctx.gameSessionStore.recordGuess(
      code,
      socket.data.userId,
      payload.text,
      tIntoRoundMs,
    );

    // Resposta privada pro autor
    let outcome: GuessOutcome;
    switch (result.kind) {
      case 'rate_limited':
        outcome = { kind: 'rate_limited' };
        break;
      case 'miss':
        outcome = { kind: 'miss' };
        break;
      case 'hit':
        outcome = {
          kind: 'hit',
          slot: { kind: result.slot.kind, display: result.slot.display },
          points: result.points,
          isTie: result.isTie,
        };
        break;
      case 'too_late':
        outcome = {
          kind: 'too_late',
          slot: { kind: result.slot.kind, display: result.slot.display },
          winners: [],
        };
        break;
    }
    socket.emit('game:guess:accepted', { outcome });

    // Broadcast slot fill (sem revelar display ainda — só na reveal)
    if (result.kind === 'hit') {
      ctx.broadcaster.toRoom(code).emit('game:slot:filled', {
        slotKind: result.slot.kind,
        winners: result.fill.winners.map((w) => ({
          userId: w.userId,
          points: w.pointsAwarded,
        })),
        isFirstFill: result.isFirstFill,
      });
    }
  });
}
