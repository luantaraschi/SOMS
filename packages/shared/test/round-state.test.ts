import { describe, expect, it } from 'vitest';
import { DISCONNECT_GRACE_MS, TIE_WINDOW_MS } from '../src/constants.js';
import {
  getActivePlayers,
  isWithinTieWindow,
  shouldEndRound,
  type PlayerSnapshot,
  type RoundState,
} from '../src/round-state.js';
import { buildSlotsForTrack } from '../src/slots.js';

function makeRoundState(overrides: Partial<RoundState> = {}): RoundState {
  const slots = buildSlotsForTrack({
    title: 'Pop',
    artists: ['Harry Styles'],
  });
  const base: RoundState = {
    trackId: 't1',
    slots,
    fills: [],
    startedAt: 1_000_000, // fixed timestamp for deterministic tests
    durationMs: 30_000,
  };
  return { ...base, ...overrides };
}

describe('shouldEndRound', () => {
  it('returns true: 2/2 slots filled e janela passou', () => {
    const rs = makeRoundState({
      fills: [
        { slotKind: 'title', winners: [], filledAt: 5_000 },
        { slotKind: 'artist', winners: [], filledAt: 6_000 },
      ],
    });
    const now = rs.startedAt + 6_000 + TIE_WINDOW_MS + 1;
    expect(shouldEndRound(rs, [], now)).toBe(true);
  });

  it('returns false: 2/2 slots filled mas janela do último ainda ativa', () => {
    const rs = makeRoundState({
      fills: [
        { slotKind: 'title', winners: [], filledAt: 5_000 },
        { slotKind: 'artist', winners: [], filledAt: 6_000 },
      ],
    });
    const now = rs.startedAt + 6_000 + TIE_WINDOW_MS - 50; // dentro da janela
    expect(shouldEndRound(rs, [], now)).toBe(false);
  });

  it('returns false: 1/2 slots filled', () => {
    const rs = makeRoundState({
      fills: [{ slotKind: 'title', winners: [], filledAt: 5_000 }],
    });
    const now = rs.startedAt + 10_000;
    expect(shouldEndRound(rs, [], now)).toBe(false);
  });

  it('jogador desconectado >grace não bloqueia (slots ainda mandam)', () => {
    const rs = makeRoundState({
      fills: [
        { slotKind: 'title', winners: [], filledAt: 5_000 },
        { slotKind: 'artist', winners: [], filledAt: 6_000 },
      ],
    });
    const now = rs.startedAt + 6_000 + TIE_WINDOW_MS + 100;
    const players: PlayerSnapshot[] = [
      { userId: 'u1', isConnected: false, lastDisconnectAt: now - DISCONNECT_GRACE_MS - 5_000 },
    ];
    expect(shouldEndRound(rs, players, now)).toBe(true);
  });
});

describe('isWithinTieWindow', () => {
  it('150ms após primeiro → true', () => {
    expect(isWithinTieWindow(5_150, 5_000)).toBe(true);
  });

  it(`${TIE_WINDOW_MS}ms exato após primeiro → true (boundary inclusive)`, () => {
    expect(isWithinTieWindow(5_000 + TIE_WINDOW_MS, 5_000)).toBe(true);
  });

  it('250ms após primeiro → false (excede janela)', () => {
    expect(isWithinTieWindow(5_250, 5_000)).toBe(false);
  });
});

describe('getActivePlayers', () => {
  it('retorna conectados + desconectados dentro da grace; exclui passou grace', () => {
    const now = 1_000_000;
    const players: PlayerSnapshot[] = [
      { userId: 'connected', isConnected: true },
      { userId: 'recent-disco', isConnected: false, lastDisconnectAt: now - 5_000 },
      { userId: 'old-disco', isConnected: false, lastDisconnectAt: now - DISCONNECT_GRACE_MS - 1 },
      { userId: 'never-disco-no-stamp', isConnected: false },
    ];
    const result = getActivePlayers(players, now);
    expect(result.map((p) => p.userId)).toEqual(['connected', 'recent-disco']);
  });
});
