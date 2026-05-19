import { describe, expect, it } from 'vitest';
import { nicknameErrorMessage, validateNickname } from '../src/nickname.js';

describe('validateNickname', () => {
  it('"" → empty', () => {
    const r = validateNickname('');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('empty');
  });

  it('"   " (só espaços) → empty (após trim)', () => {
    const r = validateNickname('   ');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('empty');
  });

  it('" a " (1 char após trim) → too_short', () => {
    const r = validateNickname(' a ');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_short');
  });

  it('"a" (1 char) → too_short', () => {
    const r = validateNickname('a');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_short');
  });

  it('"ab" (2 chars, mínimo) → ok normalized "ab"', () => {
    const r = validateNickname('ab');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized).toBe('ab');
  });

  it('"a".repeat(20) (máximo) → ok', () => {
    const r = validateNickname('a'.repeat(20));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized.length).toBe(20);
  });

  it('"a".repeat(21) (acima do max) → too_long', () => {
    const r = validateNickname('a'.repeat(21));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_long');
  });

  it('nickname com char de controle (0x01) → control_chars', () => {
    const r = validateNickname(`ab${String.fromCharCode(1)}cd`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('control_chars');
  });

  it('nickname com DEL (0x7F) → control_chars', () => {
    const r = validateNickname(`ab${String.fromCharCode(0x7f)}`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('control_chars');
  });

  it('"  memi  " → ok normalized "memi"', () => {
    const r = validateNickname('  memi  ');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized).toBe('memi');
  });

  it('aceita caracteres com acento e símbolos comuns', () => {
    const r = validateNickname('memí_42');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized).toBe('memí_42');
  });
});

describe('nicknameErrorMessage', () => {
  it('todas as 4 razões têm mensagem pt-BR lowercase', () => {
    expect(nicknameErrorMessage('empty')).toBe('digita um apelido aí.');
    expect(nicknameErrorMessage('too_short')).toMatch(/mínimo/);
    expect(nicknameErrorMessage('too_long')).toMatch(/passou/);
    expect(nicknameErrorMessage('control_chars')).toMatch(/símbolos/);
  });
});
