import { config } from './config.js';
import { logger } from './logger.js';
import { buildServer } from './server.js';

const SHUTDOWN_TIMEOUT_MS = 5_000;

async function main(): Promise<void> {
  const { fastify, io } = await buildServer();

  await fastify.listen({ port: config.port, host: '0.0.0.0' });
  logger.info(
    { port: config.port, env: config.nodeEnv, cors: config.corsOrigins },
    'realtime up',
  );

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutdown signal received');

    const force = setTimeout(() => {
      logger.error('shutdown timeout exceeded — forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    force.unref();

    try {
      io.disconnectSockets(true);
      await new Promise<void>((resolveClose) => io.close(() => resolveClose()));
      await fastify.close();
      logger.info('shutdown complete');
      clearTimeout(force);
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

main().catch((err: unknown) => {
  logger.error({ err }, 'fatal startup error');
  process.exit(1);
});
