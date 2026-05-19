/**
 * Validação de room code — single source of truth.
 *
 * O alfabeto bate exatamente com apps/realtime/src/rooms/code-generator.ts:
 * 24 letras maiúsculas A-H, J-N, P-Z (sem I e O, que viram 1 e 0).
 */
import { ROOM_CODE_LENGTH } from './constants.js';

const ROOM_CODE_REGEX = /^[A-HJ-NP-Z]{4}$/;

export type RoomCodeInvalidReason = 'empty' | 'wrong_length' | 'invalid_chars';

export type RoomCodeValidation =
  | { ok: true; normalized: string }
  | { ok: false; reason: RoomCodeInvalidReason };

export function validateRoomCode(raw: string): RoomCodeValidation {
  const normalized = raw.trim().toUpperCase();

  if (normalized.length === 0) return { ok: false, reason: 'empty' };
  if (normalized.length !== ROOM_CODE_LENGTH) {
    return { ok: false, reason: 'wrong_length' };
  }
  if (!ROOM_CODE_REGEX.test(normalized)) {
    return { ok: false, reason: 'invalid_chars' };
  }

  return { ok: true, normalized };
}

export function roomCodeErrorMessage(reason: RoomCodeInvalidReason): string {
  switch (reason) {
    case 'empty':
      return 'digita o código da sala.';
    case 'wrong_length':
      return `${ROOM_CODE_LENGTH} letras.`;
    case 'invalid_chars':
      return 'só letras (sem i, o, zero ou um).';
  }
}
