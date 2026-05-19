/**
 * Adapter do realtime sobre o validateNickname canônico do @soms/shared.
 *
 * RoomManager espera `NicknameValidationError | null` (null = ok).
 * @soms/shared retorna discriminated union. Este wrapper converte.
 *
 * Quando precisar adicionar regras específicas do realtime (ex: blacklist de
 * nicknames problemáticos), faça aqui — sem mexer no shared (consumido pelo
 * apps/web também).
 */
import { validateNickname as sharedValidateNickname } from '@soms/shared';

export type NicknameValidationError = {
  code: 'NICKNAME_INVALID';
  reason: string;
};

export function validateNickname(name: string): NicknameValidationError | null {
  const result = sharedValidateNickname(name);
  if (result.ok) return null;
  return { code: 'NICKNAME_INVALID', reason: result.reason };
}
