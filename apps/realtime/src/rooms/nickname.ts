import { MAX_NICKNAME_LENGTH, MIN_NICKNAME_LENGTH } from '@soms/shared';

export type NicknameValidationError =
  | { code: 'NICKNAME_INVALID'; reason: string };

export function validateNickname(name: string): NicknameValidationError | null {
  const trimmed = name.trim();
  if (trimmed.length < MIN_NICKNAME_LENGTH) {
    return { code: 'NICKNAME_INVALID', reason: `length < ${MIN_NICKNAME_LENGTH}` };
  }
  if (trimmed.length > MAX_NICKNAME_LENGTH) {
    return { code: 'NICKNAME_INVALID', reason: `length > ${MAX_NICKNAME_LENGTH}` };
  }
  if (hasControlChar(trimmed)) {
    return { code: 'NICKNAME_INVALID', reason: 'control characters not allowed' };
  }
  return null;
}

function hasControlChar(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c <= 0x1f || c === 0x7f) return true;
  }
  return false;
}
