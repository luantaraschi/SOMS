/**
 * Validação de nickname — single source of truth.
 *
 * Usado em ambas as pontas:
 *   - apps/web: validação client antes de submit (mostra mensagem em pt-BR).
 *   - apps/realtime: validação no handshake do socket + no joinRoom.
 *
 * O wrapper em `apps/realtime/src/rooms/nickname.ts` adapta o retorno desta
 * função pro shape `NicknameValidationError | null` que o RoomManager espera.
 */
import { MAX_NICKNAME_LENGTH, MIN_NICKNAME_LENGTH } from './constants.js';

export type NicknameInvalidReason =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'control_chars';

export type NicknameValidation =
  | { ok: true; normalized: string }
  | { ok: false; reason: NicknameInvalidReason };

export function validateNickname(raw: string): NicknameValidation {
  const trimmed = raw.trim();

  if (trimmed.length === 0) return { ok: false, reason: 'empty' };
  if (trimmed.length < MIN_NICKNAME_LENGTH) {
    return { ok: false, reason: 'too_short' };
  }
  if (trimmed.length > MAX_NICKNAME_LENGTH) {
    return { ok: false, reason: 'too_long' };
  }

  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed.charCodeAt(i);
    if (c < 0x20 || c === 0x7f) {
      return { ok: false, reason: 'control_chars' };
    }
  }

  return { ok: true, normalized: trimmed };
}

/**
 * Mensagem em pt-BR — lowercase (voz SOMS).
 */
export function nicknameErrorMessage(reason: NicknameInvalidReason): string {
  switch (reason) {
    case 'empty':
      return 'digita um apelido aí.';
    case 'too_short':
      return `muito curto. mínimo ${MIN_NICKNAME_LENGTH} letras.`;
    case 'too_long':
      return `passou de ${MAX_NICKNAME_LENGTH} letras.`;
    case 'control_chars':
      return 'só letras, números e símbolos simples.';
  }
}
