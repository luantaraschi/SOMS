import type { AddressInfo } from 'node:net';
import type {
  GameCountdownEvent,
  GameEndedEvent,
  GameGuessAcceptedEvent,
  GameReadyNextRoundAck,
  GameRoundRevealEvent,
  GameRoundStartedEvent,
  GameSlotFilledEvent,
  GameStartAck,
  RoomCreateAck,
  RoomJoinAck,
  RoomSettings,
  ServerError,
} from '@soms/shared';
import type { FastifyInstance } from 'fastify';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@soms/db', () => ({
  prisma: {
    track: { findMany: vi.fn() },
    user: { upsert: vi.fn() },
    room: { upsert: vi.fn() },
    game: { create: vi.fn() },
    round: { create: vi.fn() },
    $transaction: vi.fn((cb: (tx: unknown) => Promise<unknown>) => cb({})),
  },
}));

vi.mock('@soms/deezer', () => ({
  getTrackById: vi.fn(),
}));

const { prisma } = await import('@soms/db');
const { getTrackById } = await import('@soms/deezer');
const { buildServer } = await import('../src/server.js');
const { GameSessionStore } = await import('../src/game/session-store.js');

type TypedServer = import('../src/socket/types.js').TypedServer;
type Built = Awaited<ReturnType<typeof buildServer>>;

const HOST_USER_ID = '550e8400-e29b-41d4-a716-446655440021';
const MEMBER_USER_ID = '550e8400-e29b-41d4-a716-446655440022';

// Durações curtas pra teste rápido. 50/1500/50/25ms.
// Round duration ≥ 1500 dá margem pra tie window (200ms) fechar entre fills
// distintos (rate-limited entre guesses do mesmo player em 400ms).
const FAST_RUNNER_CONFIG = {
  countdownMs: 50,
  roundDurationMs: 1500,
  revealDurationMs: 50,
  earlyCheckIntervalMs: 25,
};

const settings: RoomSettings = {
  totalRounds: 3,
  roundDurationSeconds: 30,
  trackSource: { type: 'genre_decade', genres: [], decades: [] },
};

const fakeTracks = [
  { id: 't1', providerTrackId: '101', title: 'Drake', artists: ['Aubrey'], decade: 2010 },
  { id: 't2', providerTrackId: '102', title: 'Apple', artists: ['Banana'], decade: 2010 },
  { id: 't3', providerTrackId: '103', title: 'Mango', artists: ['Cherry'], decade: 2010 },
];
const allTracks = [...fakeTracks, ...Array.from({ length: 7 }, (_, i) => ({
  id: `s${i}`,
  providerTrackId: `${200 + i}`,
  title: `Spare${i}`,
  artists: [`SpareA${i}`],
  decade: 2010,
}))];

function deezerDetail(providerId: string) {
  return {
    id: Number(providerId),
    title: `t${providerId}`,
    preview: `https://fake.dzcdn.net/${providerId}.mp3`,
    duration: 30,
    artist: { id: 1, name: 'A' },
    album: { id: 1, title: 'B', cover_xl: `https://fake.dzcdn.net/${providerId}.jpg` },
  };
}

let built: Built;
let fastify: FastifyInstance;
let io: TypedServer;
let url: string;
const openClients: ClientSocket[] = [];

beforeEach(async () => {
  vi.mocked(prisma.track.findMany).mockResolvedValue(allTracks as never);
  vi.mocked(getTrackById).mockImplementation(async (id) => deezerDetail(String(id)));

  built = await buildServer({
    runnerConfig: FAST_RUNNER_CONFIG,
    disablePersist: true,
  });
  fastify = built.fastify;
  io = built.io;
  await fastify.listen({ port: 0, host: '127.0.0.1' });
  const addr = fastify.server.address() as AddressInfo;
  url = `http://127.0.0.1:${addr.port}`;
});

afterEach(async () => {
  built.roundRunner.cleanupAll();
  for (const c of openClients) if (c.connected) c.disconnect();
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

function waitForConnect(c: ClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
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

function waitForEvent<T>(c: ClientSocket, event: string, timeoutMs = 4_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`event "${event}" timeout`)), timeoutMs);
    c.once(event, (payload: T) => {
      clearTimeout(t);
      resolve(payload);
    });
  });
}

function emitAck<T>(c: ClientSocket, event: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`ack "${event}" timeout`)), 4_000);
    c.emit(event, ...args, (res: T) => {
      clearTimeout(t);
      resolve(res);
    });
  });
}

async function setupGameInPlayingStatus(): Promise<{
  host: ClientSocket;
  member: ClientSocket;
  code: string;
}> {
  const host = connect(HOST_USER_ID, 'host');
  await waitForConnect(host);
  const created = await emitAck<RoomCreateAck>(host, 'room:create', { settings });
  if (!created.ok) throw new Error('create failed');

  const member = connect(MEMBER_USER_ID, 'memi');
  await waitForConnect(member);
  await emitAck<RoomJoinAck>(member, 'room:join', { code: created.code });

  const roundStartedP = waitForEvent<GameRoundStartedEvent>(host, 'game:round:started');
  await emitAck<GameStartAck>(host, 'game:start');
  await roundStartedP;

  return { host, member, code: created.code };
}

describe('game loop — full game', () => {
  it('partida completa de 3 rounds termina com game:ended e ranking', async () => {
    const host = connect(HOST_USER_ID, 'host');
    await waitForConnect(host);
    const created = await emitAck<RoomCreateAck>(host, 'room:create', { settings });
    if (!created.ok) throw new Error();
    const member = connect(MEMBER_USER_ID, 'memi');
    await waitForConnect(member);
    await emitAck<RoomJoinAck>(member, 'room:join', { code: created.code });

    // Registra listener ANTES de game:start pra capturar round 0
    let roundsStarted = 0;
    host.on('game:round:started', () => {
      roundsStarted++;
      const round = built.gameSessionStore.getSession(created.code)?.currentRound;
      if (!round) return;
      // Acerta título; após 450ms (rate limit), acerta artista — encerra cedo
      host.emit('game:guess', { text: round.queueItem.title });
      setTimeout(() => {
        const r = built.gameSessionStore.getSession(created.code)?.currentRound;
        if (r) host.emit('game:guess', { text: r.queueItem.artists[0] ?? '' });
      }, 450);
    });

    const endedP = waitForEvent<GameEndedEvent>(host, 'game:ended', 10_000);
    await emitAck<GameStartAck>(host, 'game:start');
    const ended = await endedP;

    expect(ended.totalRounds).toBe(3);
    expect(ended.ranking).toHaveLength(2);
    expect(ended.ranking[0]?.position).toBe(1);
    expect(ended.ranking[0]?.totalPoints).toBeGreaterThan(0);
    expect(roundsStarted).toBe(3);
    expect(member.connected).toBe(true);
  }, 15_000);

  it('round encerra por timeout quando ninguém acerta', async () => {
    const { host, code } = await setupGameInPlayingStatus();
    const revealP = waitForEvent<GameRoundRevealEvent>(host, 'game:round:reveal', 3_000);
    // Ninguém envia guess. Espera o timeout (roundDurationMs=1500).
    const reveal = await revealP;
    expect(reveal.endedReason).toBe('timeout');
    expect(reveal.fills).toHaveLength(0);
    expect(reveal.scoresSnapshot).toBeDefined();
    expect(code).toBeDefined();
  }, 10_000);

  it('round encerra antecipadamente após todos slots filled + tie window fechar', async () => {
    const { host, code } = await setupGameInPlayingStatus();
    const session = built.gameSessionStore.getSession(code);
    const round = session?.currentRound;
    if (!round) throw new Error('no round');

    const revealP = waitForEvent<GameRoundRevealEvent>(host, 'game:round:reveal', 4_000);
    host.emit('game:guess', { text: round.queueItem.title });
    // Espera rate limit + tie window
    await new Promise((r) => setTimeout(r, 450));
    host.emit('game:guess', { text: round.queueItem.artists[0] ?? '' });

    const reveal = await revealP;
    expect(reveal.endedReason).toBe('early');
    expect(reveal.fills.length).toBeGreaterThanOrEqual(1);
  }, 10_000);

  it('empate temporal: 2 players acertam title dentro de 200ms, ambos pontuam', async () => {
    const { host, member, code } = await setupGameInPlayingStatus();
    const round = built.gameSessionStore.getSession(code)?.currentRound;
    if (!round) throw new Error();

    const slotFilledP = waitForEvent<GameSlotFilledEvent>(host, 'game:slot:filled');
    host.emit('game:guess', { text: round.queueItem.title });
    // Member acerta o mesmo título logo após — dentro da tie window de 200ms
    member.emit('game:guess', { text: round.queueItem.title });

    const fill = await slotFilledP;
    expect(fill.isFirstFill).toBe(true);
    expect(fill.slotKind).toBe('title');
    // Aguarda um pouco e checa se member também foi adicionado como winner
    await new Promise((r) => setTimeout(r, 100));
    const finalRound = built.gameSessionStore.getSession(code)?.currentRound
      ?? built.gameSessionStore.getSession(code)?.completedRounds[0];
    const titleFill = finalRound?.fills.find((f) => f.slotKind === 'title');
    expect(titleFill?.winners).toHaveLength(2);
  }, 10_000);

  it('too_late: player B acerta o mesmo title fora da tie window → outcome too_late', async () => {
    const { host, member, code } = await setupGameInPlayingStatus();
    const round = built.gameSessionStore.getSession(code)?.currentRound;
    if (!round) throw new Error();

    const memberOutcomeP = waitForEvent<GameGuessAcceptedEvent>(member, 'game:guess:accepted');
    host.emit('game:guess', { text: round.queueItem.title });

    // Espera passar a tie window (200ms) E o rate limit do member (400ms)
    await new Promise((r) => setTimeout(r, 250));
    member.emit('game:guess', { text: round.queueItem.title });

    const outcome = await memberOutcomeP;
    expect(outcome.outcome.kind).toBe('too_late');
  }, 10_000);

  it('rate limit: mesmo player envia 2 guesses em <400ms → 2º retorna rate_limited', async () => {
    const { host } = await setupGameInPlayingStatus();

    const outcomes: GameGuessAcceptedEvent[] = [];
    host.on('game:guess:accepted', (e) => outcomes.push(e));
    host.emit('game:guess', { text: 'wrong-answer-1' });
    host.emit('game:guess', { text: 'wrong-answer-2' });

    await new Promise((r) => setTimeout(r, 200));
    expect(outcomes.length).toBe(2);
    expect(outcomes[0]?.outcome.kind).toBe('miss');
    expect(outcomes[1]?.outcome.kind).toBe('rate_limited');
  }, 10_000);

  it('host chama game:ready_next_round durante reveal → pula timer e vai pro countdown', async () => {
    const { host, code } = await setupGameInPlayingStatus();
    const revealP = waitForEvent<GameRoundRevealEvent>(host, 'game:round:reveal');
    await revealP; // round 1 termina por timeout (500ms)

    const countdownP = waitForEvent<GameCountdownEvent>(host, 'game:countdown', 2_000);
    const ack = await emitAck<GameReadyNextRoundAck>(host, 'game:ready_next_round');
    expect(ack.ok).toBe(true);
    const countdown = await countdownP;
    expect(countdown.secondsLeft).toBeGreaterThanOrEqual(0);
    expect(code).toBeDefined();
  }, 10_000);

  it('game:guess fora de "playing" emite error event', async () => {
    const host = connect(HOST_USER_ID, 'host');
    await waitForConnect(host);
    await emitAck<RoomCreateAck>(host, 'room:create', { settings });
    // Em lobby, não em playing
    const errorP = waitForEvent<ServerError>(host, 'error');
    host.emit('game:guess', { text: 'qualquer' });
    const err = await errorP;
    expect(err.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('reconexão mid-game: snapshot inclui gameState com currentRound', async () => {
    const { member, code } = await setupGameInPlayingStatus();
    member.disconnect();
    await new Promise((r) => setTimeout(r, 100));

    const member2 = connect(MEMBER_USER_ID, 'memi');
    const snapshotP = waitForEvent<{ gameState?: import('@soms/shared').GameStateSnapshot }>(
      member2,
      'room:snapshot',
    );
    await waitForConnect(member2);
    const snapshot = await snapshotP;
    expect(snapshot.gameState).toBeDefined();
    expect(snapshot.gameState?.currentRound).toBeDefined();
    expect(snapshot.gameState?.totalRounds).toBe(3);
    expect(code).toBeDefined();
  }, 10_000);
});
