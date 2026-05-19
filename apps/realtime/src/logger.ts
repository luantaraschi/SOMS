import { pino } from 'pino';
import { config } from './config.js';

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;

const usePretty = !isTest && config.nodeEnv === 'development';

export const logger = pino({
  level: isTest ? 'silent' : config.logLevel,
  base: { module: 'realtime' },
  ...(usePretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});
