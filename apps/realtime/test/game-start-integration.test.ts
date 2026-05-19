import type { AddressInfo } from 'node:net';
import type {
  GamePreparingEvent,
  GameStartAck,
  RoomCreateAck,
  RoomJoinAck,
  RoomSettings,
  RoomStatusChangedEvent,
} from '@soms/shared';
import type { FastifyInstance } from 'fastify';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@soms/db', () => ({
  prisma: {
    track: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@soms/deezer', () => ({
  getTrackById: vi.fn(),
}));

const { prisma } = await import('@soms/db');
const { getTrackById } = await import('@soms/deezer');
const { buildServer } = await import('../src/server.js');
type TypedServer = import('../src/socket/types.js').TypedServer;

const HOST_USER_ID = '550e8400-e29b-41d4-a716-446655440011';
const MEMBER_USER_ID = '550e8400-e29b-41d4-a716-446655440012';

const settings: RoomSettings = {
  totalRounds: 3,
  roundDurationSeconds: 30,
  trackSource: { type: 'genre_decade', genres: ['pop'], decades: [2010] },
};

let fastify: FastifyInstance;
let io: TypedServer;
let url: string;
const openClients: ClientSocket[] = [];

beforeEach(async () => {
  vi.mocked(prisma.track.findMany).mockReset();
  vi.mocked(getTrackById).mockReset();
  const built = await buildServer();
  fastify = built.fastify;
  io = built.io;
  await fastify.listen({ port: 0, host: '127.0.0.1' });
  const addr = fastify.server.address() as AddressInfo;
  url = `http://127.0.0.1:${addr.port}`;
});

afterEach(async () => {
  for (const c of openClients) {
    if (c.connected) c.disconnect();
  }
  openClients.length = 0;
  io.disconnectSockets(true);
  await new Promise<void>((resolve) => io.close(() => resolve()));
  await fastify.close();
});

function connect(userId: string, nickname: string): ClientSocket {
  const c: ClientSocket = ioClient(url, {
    transports: ['websocket'],
    reconnection: false,
    auth: { userId, nickname },
  });
  openClients.push(c);
  return c;
}

async function waitForConnect(c: ClientSocket): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('connect timeout')), 2_000);
    c.once('connect_error', (err) => {
      clearTimeout(t);
      reject(err);
    });
    c.once('connect', () => {
      clearTimeout(t);
      resolve();
    });
  });
}

function waitForEvent<T>(
  c: ClientSocket,
  event: string,
  timeoutMs = 4_000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`event "${event}" timeout`)), timeoutMs);
    c.once(event, (payload: T) => {
      clearTimeout(t);
      resolve(payload);
    });
  });
}

function emitAck<T>(c: ClientSocket, event: string, ...args: unknown[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`ack "${event}" timeout`)), 4_000);
    c.emit(event, ...args, (res: T) => {
      clearTimeout(t);
      resolve(res);
    });
  });
}

function fakeTrackRows(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    providerTrackId: `${100 + i}`,
    title: `Song ${i}`,
    artists: [`Artist ${i}`],
    decade: 2010,
  }));
}

function fakeDeezerDetail(id: string) {
  return {
    id: Number(id),
    title: `t${id}`,
    preview: `https://fake-cdn.dzcdn.net/${id}.mp3?hdnea=exp=999`,
    duration: 30,
    artist: { id: 1, name: 'A' },
    album: { id: 1, title: 'B', cover_xl: `https://fake-cdn.dzcdn.net/${id}.jpg` },
  };
}

describe('game:start integration', () => {
  it('flow completo: game:preparing → ack ok → room:status:changed (lobby→countdown)', async () => {
    vi.mocked(prisma.track.findMany).mockResolvedValue(fakeTrackRows(20) as never);
    vi.mocked(getTrackById).mockImplementation(async (id) => fakeDeezerDetail(String(id)));

    const host = connect(HOST_USER_ID, 'host');
    await waitForConnect(host);
    const createAck = await emitAck<RoomCreateAck>(host, 'room:create', { settings });
    if (!createAck.ok) throw new Error('create failed');

    const member = connect(MEMBER_USER_ID, 'memi');
    await waitForConnect(member);
    await emitAck<RoomJoinAck>(member, 'room:join', { code: createAck.code });

    const preparingHostP = waitForEvent<GamePreparingEvent>(host, 'game:preparing');
    const preparingMemberP = waitForEvent<GamePreparingEvent>(member, 'game:preparing');
    const statusChangedHostP = waitForEvent<RoomStatusChangedEvent>(
      host,
      'room:status:changed',
    );
    const statusChangedMemberP = waitForEvent<RoomStatusChangedEvent>(
      member,
      'room:status:changed',
    );

    const ack = await emitAck<GameStartAck>(host, 'game:start');
    expect(ack.ok).toBe(true);

    const [prepHost, prepMember, statusHost, statusMember] = await Promise.all([
      preparingHostP,
      preparingMemberP,
      statusChangedHostP,
      statusChangedMemberP,
    ]);
    expect(prepHost.totalRounds).toBe(3);
    expect(prepMember.totalRounds).toBe(3);
    expect(statusHost).toEqual({ from: 'lobby', to: 'countdown' });
    expect(statusMember).toEqual({ from: 'lobby', to: 'countdown' });
  });

  it('non-host chama game:start → ack erro NOT_HOST', async () => {
    vi.mocked(prisma.track.findMany).mockResolvedValue(fakeTrackRows(20) as never);
    vi.mocked(getTrackById).mockImplementation(async (id) => fakeDeezerDetail(String(id)));

    const host = connect(HOST_USER_ID, 'host');
    await waitForConnect(host);
    const createAck = await emitAck<RoomCreateAck>(host, 'room:create', { settings });
    if (!createAck.ok) throw new Error();

    const member = connect(MEMBER_USER_ID, 'memi');
    await waitForConnect(member);
    await emitAck<RoomJoinAck>(member, 'room:join', { code: createAck.code });

    const ack = await emitAck<GameStartAck>(member, 'game:start');
    expect(ack.ok).toBe(false);
    expect(ack.error?.code).toBe('NOT_HOST');
  });

  it('Postgres com poucas tracks → ack erro INSUFFICIENT_TRACKS, status mantém lobby', async () => {
    vi.mocked(prisma.track.findMany).mockResolvedValue(fakeTrackRows(2) as never);

    const host = connect(HOST_USER_ID, 'host');
    await waitForConnect(host);
    await emitAck<RoomCreateAck>(host, 'room:create', { settings });

    const ack = await emitAck<GameStartAck>(host, 'game:start');
    expect(ack.ok).toBe(false);
    expect(ack.error?.code).toBe('INSUFFICIENT_TRACKS');
    // getTrackById nunca chamado porque falhou no select
    expect(vi.mocked(getTrackById).mock.calls.length).toBe(0);
  });

  it('Deezer indisponível durante pre-load → ack erro DEEZER_UNAVAILABLE_FOR_START', async () => {
    vi.mocked(prisma.track.findMany).mockResolvedValue(fakeTrackRows(20) as never);
    vi.mocked(getTrackById).mockRejectedValue(new Error('deezer 503'));

    const host = connect(HOST_USER_ID, 'host');
    await waitForConnect(host);
    await emitAck<RoomCreateAck>(host, 'room:create', { settings });

    // listener pra game:preparing — DEVE ter sido emitido antes do erro
    const preparingP = waitForEvent<GamePreparingEvent>(host, 'game:preparing');
    const ack = await emitAck<GameStartAck>(host, 'game:start');
    await preparingP;

    expect(ack.ok).toBe(false);
    expect(ack.error?.code).toBe('DEEZER_UNAVAILABLE_FOR_START');
  });
});
