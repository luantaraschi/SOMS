import type { AddressInfo } from 'node:net';
import type {
  PingAck,
  RoomCreateAck,
  RoomHostChangedEvent,
  RoomJoinAck,
  RoomKickAck,
  RoomLeaveAck,
  RoomPlayerDisconnectedEvent,
  RoomPlayerJoinedEvent,
  RoomPlayerLeftEvent,
  RoomPlayerReconnectedEvent,
  RoomSettings,
  RoomSnapshot,
  RoomTransferHostAck,
} from '@soms/shared';
import type { FastifyInstance } from 'fastify';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import type { TypedServer } from '../src/socket/types.js';

const HOST_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const MEMBER_USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const THIRD_USER_ID = '550e8400-e29b-41d4-a716-446655440003';

const defaultSettings: RoomSettings = {
  totalRounds: 5,
  roundDurationSeconds: 30,
  trackSource: { type: 'genre_decade', genres: ['pop'], decades: [2010] },
};

let fastify: FastifyInstance;
let io: TypedServer;
let url: string;
const openClients: ClientSocket[] = [];

beforeEach(async () => {
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

function connect(auth?: Record<string, unknown>): ClientSocket {
  const opts: Record<string, unknown> = {
    transports: ['websocket'],
    reconnection: false,
  };
  if (auth) opts.auth = auth;
  const client: ClientSocket = ioClient(url, opts);
  openClients.push(client);
  return client;
}

async function waitForConnect(client: ClientSocket, timeoutMs = 2_000): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('connect timeout')), timeoutMs);
    client.once('connect_error', (err) => {
      clearTimeout(t);
      reject(err);
    });
    client.once('connect', () => {
      clearTimeout(t);
      resolve();
    });
  });
}

async function waitForDisconnect(client: ClientSocket, timeoutMs = 2_000): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('disconnect timeout')), timeoutMs);
    client.once('disconnect', (reason) => {
      clearTimeout(t);
      resolve(reason);
    });
  });
}

async function waitForEvent<T>(
  client: ClientSocket,
  event: string,
  timeoutMs = 2_000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`event "${event}" timeout`)), timeoutMs);
    client.once(event, (payload: T) => {
      clearTimeout(t);
      resolve(payload);
    });
  });
}

function emitWithAck<T>(client: ClientSocket, event: string, ...args: unknown[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`ack "${event}" timeout`)), 2_000);
    client.emit(event, ...args, (res: T) => {
      clearTimeout(t);
      resolve(res);
    });
  });
}

describe('socket-integration — auth', () => {
  it('conexão sem auth → server desconecta', async () => {
    const client = connect();
    const reason = await waitForDisconnect(client, 3_000);
    expect(reason).toMatch(/io server disconnect|transport close/);
  });

  it('conexão com userId não-UUID → server desconecta', async () => {
    const client = connect({ userId: 'not-a-uuid', nickname: 'a1' });
    const reason = await waitForDisconnect(client, 3_000);
    expect(reason).toMatch(/io server disconnect|transport close/);
  });

  it('conexão com nickname inválido → server desconecta', async () => {
    const client = connect({ userId: HOST_USER_ID, nickname: '' });
    const reason = await waitForDisconnect(client, 3_000);
    expect(reason).toMatch(/io server disconnect|transport close/);
  });

  it('conexão com auth válida → conecta com sucesso', async () => {
    const client = connect({ userId: HOST_USER_ID, nickname: 'host' });
    await waitForConnect(client);
    expect(client.connected).toBe(true);
  });
});

describe('socket-integration — fluxo de sala', () => {
  it('room:create retorna ack com snapshot e código no formato', async () => {
    const host = connect({ userId: HOST_USER_ID, nickname: 'host' });
    await waitForConnect(host);

    const ack = await emitWithAck<RoomCreateAck>(host, 'room:create', {
      settings: defaultSettings,
    });
    expect(ack.ok).toBe(true);
    if (!ack.ok) return;
    expect(ack.code).toMatch(/^[A-HJ-NP-Z]{6}$/);
    expect(ack.snapshot.status).toBe('lobby');
    expect(ack.snapshot.hostUserId).toBe(HOST_USER_ID);
    expect(ack.snapshot.players).toHaveLength(1);
    expect(ack.snapshot.yourUserId).toBe(HOST_USER_ID);
  });

  it('segundo cliente faz room:join → primeiro recebe room:player:joined', async () => {
    const host = connect({ userId: HOST_USER_ID, nickname: 'host' });
    await waitForConnect(host);
    const created = await emitWithAck<RoomCreateAck>(host, 'room:create', {
      settings: defaultSettings,
    });
    if (!created.ok) throw new Error('create failed');

    const member = connect({ userId: MEMBER_USER_ID, nickname: 'memi' });
    await waitForConnect(member);

    const joinedFromHostP = waitForEvent<RoomPlayerJoinedEvent>(host, 'room:player:joined');
    const joinAck = await emitWithAck<RoomJoinAck>(member, 'room:join', {
      code: created.code,
    });
    expect(joinAck.ok).toBe(true);

    const event = await joinedFromHostP;
    expect(event.player.userId).toBe(MEMBER_USER_ID);
    expect(event.player.nickname).toBe('memi');
  });

  it('member faz room:leave → host recebe room:player:left reason=leave', async () => {
    const host = connect({ userId: HOST_USER_ID, nickname: 'host' });
    await waitForConnect(host);
    const created = await emitWithAck<RoomCreateAck>(host, 'room:create', {
      settings: defaultSettings,
    });
    if (!created.ok) throw new Error();

    const member = connect({ userId: MEMBER_USER_ID, nickname: 'memi' });
    await waitForConnect(member);
    await emitWithAck<RoomJoinAck>(member, 'room:join', { code: created.code });

    const leftP = waitForEvent<RoomPlayerLeftEvent>(host, 'room:player:left');
    const leaveAck = await emitWithAck<RoomLeaveAck>(member, 'room:leave');
    expect(leaveAck.ok).toBe(true);

    const event = await leftP;
    expect(event.userId).toBe(MEMBER_USER_ID);
    expect(event.reason).toBe('leave');
  });

  it('host sai com player presente → fallback host muda, player recebe room:host:changed', async () => {
    const host = connect({ userId: HOST_USER_ID, nickname: 'host' });
    await waitForConnect(host);
    const created = await emitWithAck<RoomCreateAck>(host, 'room:create', {
      settings: defaultSettings,
    });
    if (!created.ok) throw new Error();

    const member = connect({ userId: MEMBER_USER_ID, nickname: 'memi' });
    await waitForConnect(member);
    await emitWithAck<RoomJoinAck>(member, 'room:join', { code: created.code });

    const hostChangedP = waitForEvent<RoomHostChangedEvent>(member, 'room:host:changed');
    await emitWithAck<RoomLeaveAck>(host, 'room:leave');

    const event = await hostChangedP;
    expect(event.oldHostUserId).toBe(HOST_USER_ID);
    expect(event.newHostUserId).toBe(MEMBER_USER_ID);
    expect(event.reason).toBe('fallback');
  });

  it('cliente desconecta abruptamente → outros recebem room:player:disconnected', async () => {
    const host = connect({ userId: HOST_USER_ID, nickname: 'host' });
    await waitForConnect(host);
    const created = await emitWithAck<RoomCreateAck>(host, 'room:create', {
      settings: defaultSettings,
    });
    if (!created.ok) throw new Error();

    const member = connect({ userId: MEMBER_USER_ID, nickname: 'memi' });
    await waitForConnect(member);
    await emitWithAck<RoomJoinAck>(member, 'room:join', { code: created.code });

    const disconnectedP = waitForEvent<RoomPlayerDisconnectedEvent>(
      host,
      'room:player:disconnected',
    );
    member.disconnect();

    const event = await disconnectedP;
    expect(event.userId).toBe(MEMBER_USER_ID);
  });

  it('mesmo userId reconecta dentro do grace → host recebe room:player:reconnected e cliente recebe room:snapshot', async () => {
    const host = connect({ userId: HOST_USER_ID, nickname: 'host' });
    await waitForConnect(host);
    const created = await emitWithAck<RoomCreateAck>(host, 'room:create', {
      settings: defaultSettings,
    });
    if (!created.ok) throw new Error();

    const member1 = connect({ userId: MEMBER_USER_ID, nickname: 'memi' });
    await waitForConnect(member1);
    await emitWithAck<RoomJoinAck>(member1, 'room:join', { code: created.code });

    member1.disconnect();
    await waitForEvent<RoomPlayerDisconnectedEvent>(host, 'room:player:disconnected');

    const reconnectedP = waitForEvent<RoomPlayerReconnectedEvent>(
      host,
      'room:player:reconnected',
    );
    const member2 = connect({ userId: MEMBER_USER_ID, nickname: 'memi' });
    // Registra listener ANTES do connect: server pode emitir room:snapshot
    // imediatamente após handshake (auto-reconnect dispara async no connection).
    const snapshotP = waitForEvent<RoomSnapshot>(member2, 'room:snapshot');
    await waitForConnect(member2);
    const snapshot = await snapshotP;

    const event = await reconnectedP;
    expect(event.userId).toBe(MEMBER_USER_ID);
    expect(snapshot.code).toBe(created.code);
    expect(snapshot.yourUserId).toBe(MEMBER_USER_ID);
    expect(snapshot.players.find((p) => p.userId === MEMBER_USER_ID)?.isConnected).toBe(true);
  });

  it('room:transfer_host como host em lobby → manual change broadcast', async () => {
    const host = connect({ userId: HOST_USER_ID, nickname: 'host' });
    await waitForConnect(host);
    const created = await emitWithAck<RoomCreateAck>(host, 'room:create', {
      settings: defaultSettings,
    });
    if (!created.ok) throw new Error();

    const member = connect({ userId: MEMBER_USER_ID, nickname: 'memi' });
    await waitForConnect(member);
    await emitWithAck<RoomJoinAck>(member, 'room:join', { code: created.code });

    const hostChangedP = waitForEvent<RoomHostChangedEvent>(member, 'room:host:changed');
    const ack = await emitWithAck<RoomTransferHostAck>(host, 'room:transfer_host', {
      newHostUserId: MEMBER_USER_ID,
    });
    expect(ack.ok).toBe(true);

    const event = await hostChangedP;
    expect(event.reason).toBe('manual');
    expect(event.newHostUserId).toBe(MEMBER_USER_ID);
  });

  it('room:kick como host → member recebe room:player:left reason=kick', async () => {
    const host = connect({ userId: HOST_USER_ID, nickname: 'host' });
    await waitForConnect(host);
    const created = await emitWithAck<RoomCreateAck>(host, 'room:create', {
      settings: defaultSettings,
    });
    if (!created.ok) throw new Error();

    const member = connect({ userId: MEMBER_USER_ID, nickname: 'memi' });
    await waitForConnect(member);
    await emitWithAck<RoomJoinAck>(member, 'room:join', { code: created.code });

    const third = connect({ userId: THIRD_USER_ID, nickname: 'three' });
    await waitForConnect(third);
    await emitWithAck<RoomJoinAck>(third, 'room:join', { code: created.code });

    const leftP = waitForEvent<RoomPlayerLeftEvent>(third, 'room:player:left');
    const ack = await emitWithAck<RoomKickAck>(host, 'room:kick', {
      targetUserId: MEMBER_USER_ID,
    });
    expect(ack.ok).toBe(true);

    const event = await leftP;
    expect(event.userId).toBe(MEMBER_USER_ID);
    expect(event.reason).toBe('kick');
  });

  it('cliente já em sala tenta room:create → erro PLAYER_ALREADY_IN_ROOM', async () => {
    const host = connect({ userId: HOST_USER_ID, nickname: 'host' });
    await waitForConnect(host);
    await emitWithAck<RoomCreateAck>(host, 'room:create', { settings: defaultSettings });

    const ack = await emitWithAck<RoomCreateAck>(host, 'room:create', {
      settings: defaultSettings,
    });
    expect(ack.ok).toBe(false);
    if (ack.ok) return;
    expect(ack.error.code).toBe('PLAYER_ALREADY_IN_ROOM');
  });

  it('ping retorna ack com serverTime válido', async () => {
    const client = connect({ userId: HOST_USER_ID, nickname: 'host' });
    await waitForConnect(client);

    const before = Date.now();
    const ack = await emitWithAck<PingAck>(client, 'ping');
    const after = Date.now();
    expect(ack.serverTime).toBeGreaterThanOrEqual(before);
    expect(ack.serverTime).toBeLessThanOrEqual(after);
  });
});
