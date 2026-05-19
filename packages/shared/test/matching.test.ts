import { describe, expect, it } from 'vitest';
import { normalize } from '../src/matching.js';

describe('normalize', () => {
  it('lowercases', () => {
    expect(normalize('HELLO World')).toBe('hello world');
  });

  it('removes diacritics (acentos pt-BR)', () => {
    expect(normalize('Não é Coração')).toBe('nao e coracao');
  });

  it('collapses multiple whitespace into single space', () => {
    expect(normalize('hello    \t   world')).toBe('hello world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalize('   hi   ')).toBe('hi');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalize('   \t   ')).toBe('');
  });

  it('preserves internal punctuation (Sprint 1 não filtra pontuação)', () => {
    expect(normalize("It's a test, isn't it?")).toBe("it's a test, isn't it?");
  });
});
