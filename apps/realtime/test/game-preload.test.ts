import type { RoomSettings } from '@soms/shared';
import { pino } from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

// import APÓS vi.mock pra garantir resolução pelas implementações mocked
const { prisma } = await import('@soms/db');
const { getTrackById } = await import('@soms/deezer');
const { selectTracksForGame } = await import('../src/game/track-selector.js');
const { preloadRoundQueue } = await import('../src/game/preloader.js');
const { GameSessionStore } = await import('../src/game/session-store.js');

const silentLogger = pino({ level: 'silent' });

const baseSettings: RoomSettings = {
  totalRounds: 10,
  roundDurationSeconds: 30,
  trackSource: { type: 'genre_decade', genres: [], decades: [] },
};

type FakeTrackRow = {
  id: string;
  providerTrackId: string;
  title: string;
  artists: string[];
  decade: number | null;
};

function makeRows(n: number): FakeTrackRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    providerTrackId: `${100 + i}`,
    title: `Song ${i}`,
    artists: [`Artist ${i}`],
    decade: 2010,
  }));
}

function fakeDeezerDetail(providerId: string, opts?: { preview?: string; cover?: string }) {
  return {
    id: Number(providerId),
    title: `t${providerId}`,
    preview:
      opts?.preview ??
      `https://fake-cdn.dzcdn.net/${providerId}.mp3?hdnea=exp=999~hmac=xxx`,
    duration: 30,
    artist: { id: 1, name: 'Fake Artist' },
    album: {
      id: 1,
      title: 'Fake Album',
      cover_xl: opts?.cover ?? `https://fake-cdn.dzcdn.net/cover-${providerId}.jpg`,
    },
  };
}

beforeEach(() => {
  vi.mocked(prisma.track.findMany).mockReset();
  vi.mocked(getTrackById).mockReset();
});

describe('selectTracksForGame', () => {
  it('banco com 20 tracks, sem filtros, count=10 → retorna 10', async () => {
    vi.mocked(prisma.track.findMany).mockResolvedValue(makeRows(20) as never);
    const r = await selectTracksForGame({
      settings: baseSettings,
      count: 10,
      logger: silentLogger,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tracks).toHaveLength(10);
    expect(r.tracks[0]?.providerTrackId).toBeDefined();
  });

  it('genres=["pop"], passa where.genres.hasSome no Prisma', async () => {
    vi.mocked(prisma.track.findMany).mockResolvedValue(makeRows(5) as never);
    await selectTracksForGame({
      settings: {
        ...baseSettings,
        trackSource: { type: 'genre_decade', genres: ['pop'], decades: [] },
      },
      count: 3,
      logger: silentLogger,
    });
    const calls = vi.mocked(prisma.track.findMany).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]?.where).toMatchObject({ genres: { hasSome: ['pop'] } });
  });

  it('decades passa where.decade.in no Prisma', async () => {
    vi.mocked(prisma.track.findMany).mockResolvedValue(makeRows(5) as never);
    await selectTracksForGame({
      settings: {
        ...baseSettings,
        trackSource: { type: 'genre_decade', genres: [], decades: [2010, 2020] },
      },
      count: 3,
      logger: silentLogger,
    });
    const calls = vi.mocked(prisma.track.findMany).mock.calls;
    expect(calls[0]?.[0]?.where).toMatchObject({ decade: { in: [2010, 2020] } });
  });

  it('excludeIds passa where.id.notIn', async () => {
    vi.mocked(prisma.track.findMany).mockResolvedValue(makeRows(5) as never);
    await selectTracksForGame({
      settings: baseSettings,
      count: 3,
      excludeIds: ['t0', 't1'],
      logger: silentLogger,
    });
    const calls = vi.mocked(prisma.track.findMany).mock.calls;
    expect(calls[0]?.[0]?.where).toMatchObject({ id: { notIn: ['t0', 't1'] } });
  });

  it('count > disponível → INSUFFICIENT_TRACKS com available e requested', async () => {
    vi.mocked(prisma.track.findMany).mockResolvedValue(makeRows(3) as never);
    const r = await selectTracksForGame({
      settings: baseSettings,
      count: 10,
      logger: silentLogger,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('INSUFFICIENT_TRACKS');
    if (r.error.code === 'INSUFFICIENT_TRACKS') {
      expect(r.error.available).toBe(3);
      expect(r.error.requested).toBe(10);
    }
  });

  it('zero matched → NO_TRACKS_MATCHED', async () => {
    vi.mocked(prisma.track.findMany).mockResolvedValue([] as never);
    const r = await selectTracksForGame({
      settings: baseSettings,
      count: 5,
      logger: silentLogger,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NO_TRACKS_MATCHED');
  });
});

describe('preloadRoundQueue', () => {
  const selectedTracks = makeRows(3).map((r) => ({
    id: r.id,
    providerTrackId: r.providerTrackId,
    title: r.title,
    artists: r.artists,
    decade: r.decade ?? 0,
  }));

  it('todas vivas → queue completa com freshPreviewUrl', async () => {
    vi.mocked(getTrackById).mockImplementation(async (id) =>
      fakeDeezerDetail(String(id)),
    );
    const r = await preloadRoundQueue({
      selectedTracks,
      logger: silentLogger,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.queue).toHaveLength(3);
    expect(r.queue[0]?.freshPreviewUrl).toMatch(/^https:\/\/fake-cdn/);
    expect(r.queue[0]?.coverUrl).toMatch(/cover-/);
  });

  it('preview vazio é tratado como morta', async () => {
    vi.mocked(getTrackById).mockImplementation(async (id) =>
      fakeDeezerDetail(String(id), { preview: '' }),
    );
    const r = await preloadRoundQueue({
      selectedTracks,
      logger: silentLogger,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('INSUFFICIENT_FRESH_TRACKS');
  });

  it('algumas mortas + spares suficientes → queue completa usando spares', async () => {
    const spares = makeRows(5)
      .slice()
      .map((r) => ({
        id: `s${r.id}`,
        providerTrackId: `${500 + Number(r.providerTrackId.slice(1))}`,
        title: r.title,
        artists: r.artists,
        decade: r.decade ?? 0,
      }));
    vi.mocked(getTrackById).mockImplementation(async (id) => {
      const idStr = String(id);
      // selected[0] morta (404), selected[1] preview vazio, selected[2] viva
      if (idStr === '100') return null;
      if (idStr === '101') return fakeDeezerDetail(idStr, { preview: '' });
      return fakeDeezerDetail(idStr);
    });

    const r = await preloadRoundQueue({
      selectedTracks,
      spareTracks: spares,
      logger: silentLogger,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.queue).toHaveLength(3);
  });

  it('mortas demais e spares insuficientes → INSUFFICIENT_FRESH_TRACKS', async () => {
    vi.mocked(getTrackById).mockResolvedValue(null); // todas mortas (404)
    const r = await preloadRoundQueue({
      selectedTracks,
      spareTracks: [],
      logger: silentLogger,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('INSUFFICIENT_FRESH_TRACKS');
    if (r.error.code === 'INSUFFICIENT_FRESH_TRACKS') {
      expect(r.error.got).toBe(0);
      expect(r.error.needed).toBe(3);
    }
  });

  it('todas as requests rejeitam (Deezer down) → DEEZER_UNAVAILABLE', async () => {
    vi.mocked(getTrackById).mockRejectedValue(new Error('Deezer unavailable'));
    const r = await preloadRoundQueue({
      selectedTracks,
      logger: silentLogger,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('DEEZER_UNAVAILABLE');
  });

  it('mix de OK + rejected: rejected são tratadas como mortas, substituídas por spares vivos', async () => {
    const spares = makeRows(2)
      .slice()
      .map((r) => ({
        id: `s${r.id}`,
        providerTrackId: `${500 + Number(r.providerTrackId.slice(1))}`,
        title: r.title,
        artists: r.artists,
        decade: r.decade ?? 0,
      }));
    vi.mocked(getTrackById).mockImplementation(async (id) => {
      const idStr = String(id);
      if (idStr === '100') throw new Error('timeout'); // rejected
      return fakeDeezerDetail(idStr); // OK pro resto
    });
    const r = await preloadRoundQueue({
      selectedTracks,
      spareTracks: spares,
      logger: silentLogger,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.queue).toHaveLength(3);
  });
});

describe('GameSessionStore', () => {
  it('startSession armazena e getSession devolve', () => {
    const store = new GameSessionStore({ logger: silentLogger });
    const session = store.startSession({
      code: 'ABCDEF',
      queue: [],
      settings: baseSettings,
    });
    expect(session.code).toBe('ABCDEF');
    expect(session.currentRoundIndex).toBe(0);
    expect(store.getSession('ABCDEF')).toBe(session);
  });

  it('endSession remove', () => {
    const store = new GameSessionStore({ logger: silentLogger });
    store.startSession({ code: 'ABCDEF', queue: [], settings: baseSettings });
    store.endSession('ABCDEF');
    expect(store.getSession('ABCDEF')).toBeNull();
  });

  it('getAllSessions retorna lista', () => {
    const store = new GameSessionStore({ logger: silentLogger });
    store.startSession({ code: 'A', queue: [], settings: baseSettings });
    store.startSession({ code: 'B', queue: [], settings: baseSettings });
    expect(store.getAllSessions()).toHaveLength(2);
  });
});
