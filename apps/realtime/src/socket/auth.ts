import { validateNickname } from '../rooms/nickname.js';
import type { TypedSocket } from './types.js';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AuthPayload = {
  userId: string;
  nickname: string;
};

export type AuthError =
  | { code: 'MISSING_AUTH' }
  | { code: 'INVALID_USER_ID' }
  | { code: 'INVALID_NICKNAME'; reason: string };

export function validateAuth(
  socket: TypedSocket,
): { ok: true; auth: AuthPayload } | { ok: false; error: AuthError } {
  const raw = socket.handshake.auth as unknown;
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: { code: 'MISSING_AUTH' } };
  }
  const { userId, nickname } = raw as { userId?: unknown; nickname?: unknown };

  if (typeof userId !== 'string' || typeof nickname !== 'string') {
    return { ok: false, error: { code: 'MISSING_AUTH' } };
  }

  if (!UUID_V4_REGEX.test(userId)) {
    return { ok: false, error: { code: 'INVALID_USER_ID' } };
  }

  const nicknameError = validateNickname(nickname);
  if (nicknameError !== null) {
    return {
      ok: false,
      error: { code: 'INVALID_NICKNAME', reason: nicknameError.reason },
    };
  }

  return { ok: true, auth: { userId, nickname: nickname.trim() } };
}
