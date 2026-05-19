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

  it('3 chars → wrong_length', () => {
    const r = validateRoomCode('ABC');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('wrong_length');
  });

  it('5 chars → wrong_length', () => {
    const r = validateRoomCode('ABCDE');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('wrong_length');
  });

  it('"abkm" (lowercase) → ok normalized "ABKM"', () => {
    const r = validateRoomCode('abkm');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized).toBe('ABKM');
  });

  it('"  ABKM  " (com espaços) → ok normalized "ABKM"', () => {
    const r = validateRoomCode('  ABKM  ');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized).toBe('ABKM');
  });

  it('contém I → invalid_chars (I e O são proibidos)', () => {
    const r = validateRoomCode('ABCI');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_chars');
  });

  it('contém O → invalid_chars', () => {
    const r = validateRoomCode('ABCO');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_chars');
  });

  it('contém dígito → invalid_chars', () => {
    const r = validateRoomCode('AB12');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid_chars');
  });

  it('formato canônico A-HJ-NP-Z (4 letras) → ok', () => {
    const r = validateRoomCode('ZJHK');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.normalized).toBe('ZJHK');
  });
});

describe('roomCodeErrorMessage', () => {
  it('todas as 3 razões têm mensagem pt-BR lowercase', () => {
    expect(roomCodeErrorMessage('empty')).toBe('digita o código da sala.');
    expect(roomCodeErrorMessage('wrong_length')).toMatch(/4 letras/);
    expect(roomCodeErrorMessage('invalid_chars')).toMatch(/sem i, o, zero/);
  });
});
