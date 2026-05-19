/**
 * Cálculo server-authoritative de pontos por guess.
 *
 * Modelo (ARCHITECTURE.md §9):
 *   total = slot.basePoints + speed_bonus
 *   speed_bonus = SPEED_BONUS_MAX × max(0, 1 − tIntoRoundMs / durationMs), arredondado
 *
 * `isTie` é um marcador informativo apenas — empate ganha o MESMO que o
 * primeiro fill do slot (sem bônus, sem penalidade).
 *
 * NÃO implementado no Sprint 1: streak multiplier, mode multiplier (blind
 * test 1.5x/2x), approx penalty (sem Levenshtein), playlist owner delay.
 */

import { SPEED_BONUS_MAX } from './constants.js';
import type { Slot } from './slots.js';

export type CalculateGuessScoreInput = {
  slot: Slot;
  /** ms desde `startedAt` em que o player acertou. */
  tIntoRoundMs: number;
  /** Duração total do round em ms (geralmente `ROUND_DURATION_MS`). */
  durationMs: number;
  /** True se este guess caiu na tie window de um slot já com 1+ winner. Informativo, não afeta pontos. */
  isTie: boolean;
};

export function calculateGuessScore(args: CalculateGuessScoreInput): number {
  const ratio = Math.max(0, 1 - args.tIntoRoundMs / args.durationMs);
  const bonus = Math.round(SPEED_BONUS_MAX * ratio);
  return args.slot.basePoints + bonus;
}
