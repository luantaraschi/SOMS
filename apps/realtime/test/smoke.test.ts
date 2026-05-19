import type { AddressInfo } from 'node:net';
import type { FastifyInstance } from 'fastify';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import type { TypedServer } from '../src/socket/types.js';

const VALID_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('apps/realtime smoke', () => {
  let fastify: FastifyInstance;
  let io: TypedServer;
  let url: string;

  beforeAll(async () => {
    const built = await buildServer();
    fastify = built.fastify;
    io = built.io;
    await fastify.listen({ port: 0, host: '127.0.0.1' });
    const addr = fastify.server.address() as AddressInfo;
    url = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    io.disconnectSockets(true);
    await new Promise<void>((resolve) => io.close(() => resolve()));
    await fastify.close();
  });

  it('GET /health responde 200 com { status: ok, uptime, version }', async () => {
    const res = await fetch(`${url}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; uptime: number; version: string };
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(typeof body.version).toBe('string');
  });

  it('Socket.IO: cliente autenticado emite ping com ack, recebe serverTime', async () => {
    const client: ClientSocket = ioClient(url, {
      transports: ['websocket'],
      reconnection: false,
      auth: { userId: VALID_USER_ID, nickname: 'smoke' },
    });

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('connect timeout')), 3_000);
      client.once('connect_error', (err) => {
        clearTimeout(t);
        reject(err);
      });
      client.once('connect', () => {
        clearTimeout(t);
        resolve();
      });
    });

    const before = Date.now();
    const pong = await new Promise<{ serverTime: number }>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('ack timeout')), 3_000);
      client.emit('ping', (payload: { serverTime: number }) => {
        clearTimeout(t);
        resolve(payload);
      });
    });
    const after = Date.now();

    expect(typeof pong.serverTime).toBe('number');
    expect(pong.serverTime).toBeGreaterThanOrEqual(before);
    expect(pong.serverTime).toBeLessThanOrEqual(after);

    client.disconnect();
  });
});
