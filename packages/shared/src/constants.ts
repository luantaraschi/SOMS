/**
 * Constantes compartilhadas entre cliente e servidor.
 *
 * Convenções:
 * - Tudo em ms onde aplicável (não misturar segundos e ms na mesma chave).
 * - `POINTS_*` são valores BASE; bônus de velocidade soma em cima (ver scoring.ts).
 */

// ============================================================
//  Partida
// ============================================================
export const DEFAULT_TOTAL_ROUNDS = 10;
export const MIN_TOTAL_ROUNDS = 3;
export const MAX_TOTAL_ROUNDS = 15;
export const ROUND_DURATION_MS = 30_000;
export const COUNTDOWN_MS = 3_000;
export const REVEAL_DURATION_MS = 5_000;

// ============================================================
//  Slots de resposta (ver slots.ts e round-state.ts)
// ============================================================
export const TIE_WINDOW_MS = 200;
export const POINTS_TITLE = 100;
export const POINTS_ARTIST = 60;
export const POINTS_FEAT = 40;
export const SPEED_BONUS_MAX = 50;

// ============================================================
//  Player
// ============================================================
export const DISCONNECT_GRACE_MS = 10_000;
export const GUESS_RATE_LIMIT_MS = 400;
export const MIN_NICKNAME_LENGTH = 2;
export const MAX_NICKNAME_LENGTH = 20;

// ============================================================
//  Sala
// ============================================================
// 4 chars × 24 letras = 331_776 combinações. Suficiente pra qualquer escala
// prevista do produto. Reduzido de 6 → 4 por encaixe visual no card hero.
export const ROOM_CODE_LENGTH = 4;

/** Décadas disponíveis para o picker de track source (Sprint 1). */
export const DECADES = [1990, 2000, 2010, 2020] as const;
export type Decade = (typeof DECADES)[number];
