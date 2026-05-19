import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config.js';
import { GameSessionStore } from './game/session-store.js';
import { logger } from './logger.js';
import { registerCors } from './plugins/cors.js';
import { RoomManager } from './rooms/room-manager.js';
import { validateAuth } from './socket/auth.js';
import { Broadcaster, roomChannel, userChannel } from './socket/broadcaster.js';
import { registerAllHandlers } from './socket/handlers/index.js';
import { buildRoomSnapshot } from './socket/snapshot.js';
import type { TypedServer, TypedSocket } from './socket/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(here, '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };

export type BuiltServer = {
  fastify: FastifyInstance;
  io: TypedServer;
  manager: RoomManager;
  broadcaster: Broadcaster;
  gameSessionStore: GameSessionStore;
};

export async function buildServer(): Promise<BuiltServer> {
  const fastify = Fastify({
    loggerInstance: logger as unknown as FastifyBaseLogger,
  });

  await registerCors(fastify);

  fastify.get('/health', () => ({
    status: 'ok' as const,
    uptime: process.uptime(),
    version: pkg.version,
  }));

  await fastify.ready();

  const io: TypedServer = new SocketIOServer(fastify.server, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
  });

  const broadcaster = new Broadcaster(io, logger);
  const manager = new RoomManager({
    logger,
    events: broadcaster.asRoomManagerEvents(),
  });
  const gameSessionStore = new GameSessionStore({ logger });

  io.on('connection', (socket) => {
    const auth = validateAuth(socket);
    if (!auth.ok) {
      logger.warn({ socketId: socket.id, error: auth.error }, 'auth failed');
      socket.emit('error', {
        code: 'UNAUTHENTICATED',
        message: 'credenciais inválidas no handshake.',
        details: { authError: auth.error },
      });
      socket.disconnect(true);
      return;
    }

    socket.data.userId = auth.auth.userId;
    socket.data.nickname = auth.auth.nickname;
    socket.data.currentRoomCode = null;

    void socket.join(userChannel(auth.auth.userId));
    logger.info(
      { socketId: socket.id, userId: auth.auth.userId, nickname: auth.auth.nickname },
      'socket authenticated',
    );

    // Tentar reconexão: o user tem alguma sala onde está marcado como
    // desconectado dentro do grace?
    void tryAutoReconnect(socket, manager).then((reconnected) => {
      if (reconnected) {
        logger.info(
          { userId: auth.auth.userId, code: reconnected },
          'auto-reconnected to room',
        );
      }
    });

    registerAllHandlers(socket, {
      manager,
      broadcaster,
      gameSessionStore,
      logger,
    });

    socket.on('disconnect', (reason) => {
      logger.info(
        { socketId: socket.id, userId: socket.data.userId, reason },
        'socket disconnected',
      );
      const code = socket.data.currentRoomCode;
      if (code !== null) {
        manager.markPlayerDisconnected(code, socket.data.userId, Date.now());
      }
    });
  });

  return { fastify, io, manager, broadcaster, gameSessionStore };
}

/**
 * Procura uma sala onde `userId` está marcado como desconectado dentro do
 * grace period. Se encontrar, reconecta, faz socket.join e envia snapshot.
 *
 * Retorna o código da sala reconectada (ou null se nada pra reconectar).
 */
async function tryAutoReconnect(
  socket: TypedSocket,
  manager: RoomManager,
): Promise<string | null> {
  for (const room of manager.getAllRooms()) {
    const player = room.players.get(socket.data.userId);
    if (!player || player.isConnected) continue;

    const r = manager.markPlayerReconnected(room.code, socket.data.userId, Date.now());
    if (!r.ok) continue;

    socket.data.currentRoomCode = room.code;
    await socket.join(roomChannel(room.code));
    socket.emit('room:snapshot', buildRoomSnapshot(room, socket.data.userId));
    return room.code;
  }
  return null;
}
