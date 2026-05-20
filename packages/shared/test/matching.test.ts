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

  it('strips punctuation — ?, !, ., , (D3 fix)', () => {
    expect(normalize('Do I Wanna Know?')).toBe('do i wanna know');
    expect(normalize('Hey!')).toBe('hey');
    expect(normalize('Mr. Brightside')).toBe('mr brightside');
    expect(normalize('hello, world')).toBe('hello world');
  });

  it("strips apostrophes — Ain't, isn't, etc", () => {
    expect(normalize("Ain't No Sunshine")).toBe('aint no sunshine');
    expect(normalize("It's a test")).toBe('its a test');
  });

  it('match: title com pontuação vs guess sem pontuação', () => {
    expect(normalize('Do I Wanna Know?')).toBe(normalize('do i wanna know'));
    expect(normalize("Ain't No Sunshine")).toBe(normalize('aint no sunshine'));
    expect(normalize('É o Amor')).toBe(normalize('e o amor'));
  });

  it('preserves digits', () => {
    expect(normalize('99 Luftballons')).toBe('99 luftballons');
    expect(normalize('1979')).toBe('1979');
  });
});
