import { prisma } from '@soms/db';
import type { Logger } from 'pino';
import type { Room } from '../rooms/types.js';
import type { GameSession } from './session-store.js';

/**
 * Persiste o estado final de uma partida no Postgres:
 *   - Upsert User pra cada player (FK do hostId)
 *   - Upsert Room (1ª vez que essa sala é persistida — em Sprint 1, partidas
 *     vivem em memória durante o lobby)
 *   - Cria Game
 *   - Cria Round por round completado (sem guesses, decisão de produto)
 *
 * Tudo em transação. Falha aborta — não deixa registro parcial.
 */
export async function persistFinishedGame(opts: {
  code: string;
  session: GameSession;
  room: Room;
  logger: Logger;
}): Promise<{ ok: true; gameId: string } | { ok: false; error: string }> {
  const { session, code, room, logger } = opts;
  if (!session.endedAt) {
    return { ok: false, error: 'session not ended' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert User pra cada player (incluindo host e qualquer um que pontuou)
      const userIds = new Set<string>();
      for (const p of room.players.values()) userIds.add(p.userId);
      for (const sId of session.scores.keys()) userIds.add(sId);
      userIds.add(room.hostUserId);

      for (const userId of userIds) {
        const player = room.players.get(userId);
        const nickname = player?.nickname ?? 'guest';
        await tx.user.upsert({
          where: { id: userId },
          create: { id: userId, nickname, isGuest: true },
          update: { nickname, lastSeenAt: new Date() },
        });
      }

      // 2. Upsert Room
      const persistedRoom = await tx.room.upsert({
        where: { code },
        create: {
          code,
          hostId: room.hostUserId,
          mode: 'CLASSIC',
          status: 'ENDED',
          settings: session.settings as never,
          createdAt: new Date(room.createdAt),
          closedAt: new Date(session.endedAt!),
        },
        update: {
          status: 'ENDED',
          closedAt: new Date(session.endedAt!),
        },
      });

      // 3. Cria Game
      const game = await tx.game.create({
        data: {
          roomId: persistedRoom.id,
          mode: 'CLASSIC',
          totalRounds: session.queue.length,
          currentRound: session.completedRounds.length,
          status: 'ENDED',
          startedAt: new Date(session.startedAt),
          endedAt: new Date(session.endedAt!),
          finalStats: {
            ranking: Array.from(session.scores.values()).map((s) => ({
              userId: s.userId,
              totalPoints: s.totalPoints,
            })),
          } as never,
        },
      });

      // 4. Cria Rounds
      for (const r of session.completedRounds) {
        await tx.round.create({
          data: {
            gameId: game.id,
            index: r.index + 1, // 1-based no schema
            trackId: r.trackId,
            mode: 'CLASSIC',
            durationSeconds: Math.round(r.durationMs / 1000),
            startedAt: new Date(r.startedAt),
            endedAt: r.endedAt ? new Date(r.endedAt) : null,
          },
        });
      }

      return { gameId: game.id };
    });

    logger.info(
      { code, gameId: result.gameId, rounds: session.completedRounds.length },
      'game persisted',
    );
    return { ok: true, gameId: result.gameId };
  } catch (err) {
    logger.error({ err, code }, 'persist failed');
    return { ok: false, error: String(err) };
  }
}
