import { describe, expect, it } from 'vitest';
import { matchGuess, normalize } from '../src/matching.js';

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

describe('matchGuess', () => {
  const track = {
    title: 'Around the World',
    artists: ['Daft Punk', 'Featured Friend'],
  };

  it('matches title with exact text (case insensitive)', () => {
    expect(matchGuess('AROUND THE WORLD', track)).toEqual({ matched: true, field: 'title' });
  });

  it('matches title ignoring diacritics', () => {
    const trackBR = { title: 'Não Vou Me Adaptar', artists: ['Titãs'] };
    expect(matchGuess('nao vou me adaptar', trackBR)).toEqual({ matched: true, field: 'title' });
  });

  it('matches first artist (artists[0])', () => {
    expect(matchGuess('Daft Punk', track)).toEqual({ matched: true, field: 'artist' });
  });

  it('Sprint 1: does NOT match artists[1+] — only artists[0]', () => {
    // ARCHITECTURE §8 prevê match em qualquer artista; Sprint 1 simplifica
    // para artists[0]. Confirmação via SPRINT_1.md ("match por igualdade
    // contra title/artist[0]").
    expect(matchGuess('Featured Friend', track)).toEqual({ matched: false, field: null });
  });

  it('returns miss on obviously wrong guess', () => {
    expect(matchGuess('shape of you', track)).toEqual({ matched: false, field: null });
  });

  it('returns miss on empty string', () => {
    expect(matchGuess('', track)).toEqual({ matched: false, field: null });
    expect(matchGuess('   ', track)).toEqual({ matched: false, field: null });
  });
});
