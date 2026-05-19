import { describe, expect, it } from 'vitest';
import {
  POINTS_ARTIST,
  POINTS_FEAT,
  POINTS_TITLE,
  ROUND_DURATION_MS,
  SPEED_BONUS_MAX,
} from '../src/constants.js';
import { calculateGuessScore } from '../src/scoring.js';
import type { Slot } from '../src/slots.js';

const titleSlot: Slot = { kind: 'title', value: 't', display: 'T', basePoints: POINTS_TITLE };
const artistSlot: Slot = { kind: 'artist', value: 'a', display: 'A', basePoints: POINTS_ARTIST };
const featSlot: Slot = { kind: 'feat', value: 'f', display: 'F', basePoints: POINTS_FEAT };

describe('calculateGuessScore', () => {
  it('título no início do round → base + bonus máximo (150)', () => {
    expect(
      calculateGuessScore({
        slot: titleSlot,
        tIntoRoundMs: 0,
        durationMs: ROUND_DURATION_MS,
        isTie: false,
      }),
    ).toBe(POINTS_TITLE + SPEED_BONUS_MAX); // 100 + 50 = 150
  });

  it('artista no meio do round → base + bonus pela metade (85)', () => {
    expect(
      calculateGuessScore({
        slot: artistSlot,
        tIntoRoundMs: ROUND_DURATION_MS / 2,
        durationMs: ROUND_DURATION_MS,
        isTie: false,
      }),
    ).toBe(POINTS_ARTIST + Math.round(SPEED_BONUS_MAX / 2)); // 60 + 25 = 85
  });

  it('feat no fim do round → só base, bonus 0 (40)', () => {
    expect(
      calculateGuessScore({
        slot: featSlot,
        tIntoRoundMs: ROUND_DURATION_MS,
        durationMs: ROUND_DURATION_MS,
        isTie: false,
      }),
    ).toBe(POINTS_FEAT); // 40 + 0 = 40
  });

  it('empate ganha mesma pontuação que primeiro (isTie informativo, não afeta)', () => {
    const inp = { slot: titleSlot, tIntoRoundMs: 5_000, durationMs: ROUND_DURATION_MS };
    const first = calculateGuessScore({ ...inp, isTie: false });
    const tie = calculateGuessScore({ ...inp, isTie: true });
    expect(tie).toBe(first);
  });

  it('clamp defensivo: tIntoRoundMs > duration → bonus 0, sem score negativo', () => {
    expect(
      calculateGuessScore({
        slot: titleSlot,
        tIntoRoundMs: ROUND_DURATION_MS * 2,
        durationMs: ROUND_DURATION_MS,
        isTie: false,
      }),
    ).toBe(POINTS_TITLE);
  });
});
