/**
 * Constantes compartilhadas entre cliente e servidor.
 * Tudo em ms onde aplicável (não misturar segundos e ms na mesma chave).
 */

export const ROUND_DURATION_DEFAULT_MS = 20_000;
export const COUNTDOWN_SECONDS = 3;
export const MAX_GUESS_RATE_MS = 400;
export const MIN_NICKNAME_LENGTH = 2;
export const MAX_NICKNAME_LENGTH = 20;
export const ROOM_CODE_LENGTH = 6;

/** Décadas disponíveis para o picker de track source (Sprint 1). */
export const DECADES = [1990, 2000, 2010, 2020] as const;
export type Decade = (typeof DECADES)[number];
