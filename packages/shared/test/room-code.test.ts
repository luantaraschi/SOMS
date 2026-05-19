import { describe, expect, it } from 'vitest';
import {
  roomCodeErrorMessage,
  validateRoomCode,
} from '../src/room-code.js';

describe('validateRoomCode', () => {
  it('"" → empty', () => {
    const r = validateRoomCode('');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('empty');
  });

  it('"   " → empty', () => {
    const r = validateRoomCode('   ');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('empty');
  });

  it('5 chars → wrong_length', () => {
    const r = validateRoomCode('ABCDE');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('wrong_length');
  });

  it('7 chars → wrong_length', () => {
    const r = validateRoomCode('ABCDEFG');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('wrong_length');
  });

  it('"abkmnp" (lowercase) → ok normalized "ABKMNP"', () => {
    const r = validateRoomCode('abkmnp');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized).toBe('ABKMNP');
  });

  it('"  ABKMNP  " (com espaços) → ok normalized "ABKMNP"', () => {
    const r = validateRoomCode('  ABKMNP  ');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized).toBe('ABKMNP');
  });

  it('contém I → invalid_chars (I e O são proibidos)', () => {
    const r = validateRoomCode('ABCIDE');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_chars');
  });

  it('contém O → invalid_chars', () => {
    const r = validateRoomCode('ABCODE');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_chars');
  });

  it('contém dígito → invalid_chars', () => {
    const r = validateRoomCode('ABCD12');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_chars');
  });

  it('formato canônico A-HJ-NP-Z → ok', () => {
    const r = validateRoomCode('ZJHKLM');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized).toBe('ZJHKLM');
  });
});

describe('roomCodeErrorMessage', () => {
  it('todas as 3 razões têm mensagem pt-BR lowercase', () => {
    expect(roomCodeErrorMessage('empty')).toBe('digita o código da sala.');
    expect(roomCodeErrorMessage('wrong_length')).toMatch(/6 letras/);
    expect(roomCodeErrorMessage('invalid_chars')).toMatch(/sem i, o, zero/);
  });
});
