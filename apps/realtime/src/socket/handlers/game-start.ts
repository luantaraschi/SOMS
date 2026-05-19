import type { ServerError } from '@soms/shared';
import {
  preloadRoundQueue,
  selectTracksForGame,
} from '../../game/index.js';
import {
  mapPreloadErrorToServerError,
  mapSelectErrorToServerError,
} from '../error-mapping.js';
import type { TypedSocket } from '../types.js';
import type { HandlerContext } from './types.js';

const SPARE_MIN = 5;
const SPARE_MAX = 10;

export function registerGameStartHandler(
  socket: TypedSocket,
  ctx: HandlerContext,
): void {
  socket.on('game:start', (ack) => {
    void handleGameStart(socket, ctx, ack);
  });
}

async function handleGameStart(
  socket: TypedSocket,
  ctx: HandlerContext,
  ack: (res: { ok: boolean; error?: ServerError }) => void,
): Promise<void> {
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
      error: { code: 'NOT_HOST', message: 'só o host pode iniciar a partida.' },
    });
    return;
  }
  if (room.status !== 'lobby') {
    ack({
      ok: false,
      error: {
        code: 'INVALID_STATUS_TRANSITION',
        message: 'partida já em andamento.',
        details: { from: room.status, to: 'countdown' },
      },
    });
    return;
  }

  try {
    const settings = room.settings;
    const totalRounds = settings.totalRounds;

    const selectResult = await selectTracksForGame({
      settings,
      count: totalRounds,
      logger: ctx.logger,
    });
    if (!selectResult.ok) {
      ack({ ok: false, error: mapSelectErrorToServerError(selectResult.error) });
      return;
    }

    const spareCount = Math.min(SPARE_MAX, Math.max(SPARE_MIN, totalRounds));
    const sparesResult = await selectTracksForGame({
      settings,
      count: spareCount,
      excludeIds: selectResult.tracks.map((t) => t.id),
      logger: ctx.logger,
    });
    const spares = sparesResult.ok ? sparesResult.tracks : [];

    // game:preparing — informa cliente que o pre-load tá rolando
    ctx.logger.info({ code, totalRounds }, 'game:start: starting preload');
    ctx.broadcaster.toRoom(code).emit('game:preparing', { totalRounds });

    const preloadResult = await preloadRoundQueue({
      selectedTracks: selectResult.tracks,
      spareTracks: spares,
      logger: ctx.logger,
    });
    if (!preloadResult.ok) {
      ack({ ok: false, error: mapPreloadErrorToServerError(preloadResult.error) });
      return;
    }

    ctx.gameSessionStore.startSession({
      code,
      queue: preloadResult.queue,
      settings,
    });

    const transitionResult = ctx.manager.transitionTo(
      code,
      socket.data.userId,
      'countdown',
    );
    if (!transitionResult.ok) {
      ctx.gameSessionStore.endSession(code);
      ack({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'erro interno ao iniciar partida.',
          details: { transitionError: transitionResult.error.code },
        },
      });
      return;
    }

    ctx.roundRunner.startGame(code);
    ack({ ok: true });
  } catch (err) {
    ctx.logger.error({ err, code }, 'game:start: unexpected error');
    ack({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'erro interno ao iniciar partida.',
      },
    });
  }
}

