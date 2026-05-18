/**
 * Pontuação (Sprint 1 — fórmula simplificada).
 *
 * Sprint 1:
 *   - title hit: 100 base
 *   - artist hit: 60 base
 *   - + bônus de velocidade linear decrescente de 50 → 0 ao longo do round
 *
 * NÃO implementado no Sprint 1 (ver ARCHITECTURE §9):
 *   - streak multiplier
 *   - mode multiplier (blind test 1.5x / 2x)
 *   - approx penalty (sem Levenshtein → sem penalidade)
 *   - playlist owner delay
 */

import type { MatchedField } from './matching.js';

const BASE_TITLE = 100;
const BASE_ARTIST = 60;
const MAX_SPEED_BONUS = 50;

export type ScoreInput = {
  matchedField: MatchedField;
  msIntoRound: number;
  roundDurationMs: number;
};

export function scoreGuess({ matchedField, msIntoRound, roundDurationMs }: ScoreInput): number {
  const base = matchedField === 'title' ? BASE_TITLE : BASE_ARTIST;
  const ratio = Math.max(0, 1 - msIntoRound / roundDurationMs);
  const bonus = Math.round(MAX_SPEED_BONUS * ratio);
  return base + bonus;
}
