import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config.js';
import { registerPingHandler } from './handlers/ping.js';
import { logger } from './logger.js';
import { registerCors } from './plugins/cors.js';

const here = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(here, '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };

export type BuiltServer = {
  fastify: FastifyInstance;
  io: SocketIOServer;
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

  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'socket connected');
    registerPingHandler(socket);
    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'socket disconnected');
    });
  });

  return { fastify, io };
}
