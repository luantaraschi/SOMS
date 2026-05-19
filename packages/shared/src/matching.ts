/**
 * Normalização de texto para matching de respostas.
 *
 * Lógica de classificação contra slots vive em [`slots.ts`](./slots.ts)
 * → `classifyGuess`. Aqui só fica a função pura de normalize, reutilizada
 * tanto por `slots.ts` (build do slot.value) quanto pelo cliente (se quiser
 * preview do match).
 */

const DIACRITICS_RE = /[̀-ͯ]/g;
const MULTI_WS_RE = /\s+/g;

/**
 * Normaliza texto para comparação:
 * - lowercase
 * - remove acentos (NFD + filtro de diacritics)
 * - trim
 * - colapsa whitespace múltiplo para um espaço único
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .trim()
    .replace(MULTI_WS_RE, ' ');
}
