const DEFAULT_PORT = 8080;
const DEFAULT_CORS = 'http://localhost:3000';

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  port: Number.parseInt(process.env.REALTIME_PORT ?? String(DEFAULT_PORT), 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.REALTIME_LOG_LEVEL ?? (isProd ? 'warn' : 'info'),
  corsOrigins: (process.env.REALTIME_CORS_ORIGIN ?? DEFAULT_CORS)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
} as const;

export type Config = typeof config;
