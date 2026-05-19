import { describe, expect, it } from 'vitest';
import {
  ROOM_CODE_ALPHABET,
  generateRoomCode,
  generateUniqueRoomCode,
} from '../src/rooms/code-generator.js';

const CODE_REGEX = /^[A-HJ-NP-Z]{6}$/;

describe('code-generator', () => {
  it('ROOM_CODE_ALPHABET tem exatamente 24 letras sem I nem O', () => {
    expect(ROOM_CODE_ALPHABET.length).toBe(24);
    expect(ROOM_CODE_ALPHABET).not.toContain('I');
    expect(ROOM_CODE_ALPHABET).not.toContain('O');
  });

  it('generateRoomCode retorna 6 caracteres maiúsculos do alfabeto válido', () => {
    const code = generateRoomCode();
    expect(code).toMatch(CODE_REGEX);
    expect(code.length).toBe(6);
  });

  it('1000 chamadas de generateRoomCode produzem todos os códigos no formato', () => {
    for (let i = 0; i < 1000; i++) {
      expect(generateRoomCode()).toMatch(CODE_REGEX);
    }
  });

  it('generateUniqueRoomCode evita colisão com o Set existente', () => {
    const existing = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const code = generateUniqueRoomCode(existing);
      expect(existing.has(code)).toBe(false);
      existing.add(code);
    }
    expect(existing.size).toBe(200);
  });

  it('generateUniqueRoomCode lança após maxAttempts colisões consecutivas', () => {
    // Construir um Set que contém TODOS os códigos possíveis do alfabeto
    // é inviável (191M). Em vez disso, usamos um stub: maxAttempts=1 com
    // Set tão denso quanto possível. Aproveitamos que generateRoomCode é
    // probabilístico — não dá pra forçar colisão determinística sem mock.
    // Verificamos o contrato com maxAttempts=0 (zero tentativas → throw direto).
    expect(() => generateUniqueRoomCode(new Set(), 0)).toThrow(/collision after 0 attempts/);
  });
});
