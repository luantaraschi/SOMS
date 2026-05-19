import { randomInt } from 'node:crypto';
import { ROOM_CODE_LENGTH } from '@soms/shared';

/**
 * Alfabeto pra códigos de sala — 24 letras maiúsculas, sem I e O
 * pra evitar ambiguidade com 1 e 0. Espaço: 24^4 = 331.776 combinações
 * (suficiente pra qualquer escala prevista; ver TECH_DEBT.md).
 */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

const DEFAULT_MAX_ATTEMPTS = 1000;

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const idx = randomInt(ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET.charAt(idx);
  }
  return code;
}

/**
 * Gera código único — não presente em `existing`. Throw após `maxAttempts` colisões.
 * Espaço de 332k. Colisões reais começam a ser frequentes em escala alta
 * (>5k salas simultâneas); pro Sprint 1 não é preocupação real.
 */
export function generateUniqueRoomCode(
  existing: Set<string>,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
): string {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRoomCode();
    if (!existing.has(code)) return code;
  }
  throw new Error(
    `generateUniqueRoomCode: collision after ${maxAttempts} attempts (existing size: ${existing.size})`,
  );
}
