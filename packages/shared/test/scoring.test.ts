import { describe, expect, it } from 'vitest';
import { scoreGuess } from '../src/scoring.js';

describe('scoreGuess', () => {
  const ROUND_MS = 20_000;

  it('gives full speed bonus (50) at the very start of the round', () => {
    expect(
      scoreGuess({ matchedField: 'title', msIntoRound: 0, roundDurationMs: ROUND_MS }),
    ).toBe(150); // 100 base + 50 bonus
  });

  it('gives half speed bonus at midpoint of round', () => {
    expect(
      scoreGuess({ matchedField: 'title', msIntoRound: ROUND_MS / 2, roundDurationMs: ROUND_MS }),
    ).toBe(125); // 100 base + 25 bonus
  });

  it('gives zero speed bonus at end of round', () => {
    expect(
      scoreGuess({ matchedField: 'title', msIntoRound: ROUND_MS, roundDurationMs: ROUND_MS }),
    ).toBe(100); // 100 base + 0 bonus
  });

  it('uses 60 base for artist match', () => {
    expect(
      scoreGuess({ matchedField: 'artist', msIntoRound: 0, roundDurationMs: ROUND_MS }),
    ).toBe(110); // 60 base + 50 bonus
    expect(
      scoreGuess({ matchedField: 'artist', msIntoRound: ROUND_MS, roundDurationMs: ROUND_MS }),
    ).toBe(60); // 60 base + 0 bonus
  });

  it('clamps speed bonus at 0 when msIntoRound exceeds duration (defensive)', () => {
    expect(
      scoreGuess({ matchedField: 'title', msIntoRound: 25_000, roundDurationMs: ROUND_MS }),
    ).toBe(100); // não vira negativo
  });
});
