/**
 * Normalização de texto para matching de respostas.
 *
 * Lógica de classificação contra slots vive em [`slots.ts`](./slots.ts)
 * → `classifyGuess`. Aqui só fica a função pura de normalize, reutilizada
 * tanto por `slots.ts` (build do slot.value) quanto pelo cliente (se quiser
 * preview do match).
 */

const DIACRITICS_RE = /[̀-ͯ]/g;
// Apóstrofos viram nada — "Ain't" → "aint" (cola). Outras pontuações
// (?, !, ., ,, etc) viram espaço — "Mr. Brightside" → "mr brightside".
const APOSTROPHE_RE = /['’`ʼ]/g;
const PUNCTUATION_RE = /[^\p{L}\p{N}\s]/gu;
const MULTI_WS_RE = /\s+/g;

/**
 * Normaliza texto para comparação:
 * - lowercase
 * - remove acentos (NFD + filtro de diacritics)
 * - remove apóstrofos (cola: "Ain't" → "aint")
 * - troca demais pontuações por espaço (?, !, ., ,, etc) preservando letras
 *   (incluindo alfabetos não-latinos), dígitos e espaço. Bug D3: títulos como
 *   "Do I Wanna Know?" precisam casar com "do i wanna know".
 * - trim
 * - colapsa whitespace múltiplo para um espaço único
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .replace(APOSTROPHE_RE, '')
    .replace(PUNCTUATION_RE, ' ')
    .trim()
    .replace(MULTI_WS_RE, ' ');
}
