import { describe, expect, it } from 'vitest';
import {
  POINTS_ARTIST,
  POINTS_FEAT,
  POINTS_TITLE,
} from '../src/constants.js';
import { buildSlotsForTrack, classifyGuess, type Slot } from '../src/slots.js';

describe('buildSlotsForTrack', () => {
  it('cria 2 slots (title + artist) para track sem feat', () => {
    const slots = buildSlotsForTrack({
      title: 'Negro Drama',
      artists: ['Racionais MC\'s'],
    });
    expect(slots).toHaveLength(2);
    expect(slots[0]).toMatchObject({ kind: 'title', display: 'Negro Drama', basePoints: POINTS_TITLE });
    expect(slots[1]).toMatchObject({ kind: 'artist', display: "Racionais MC's", basePoints: POINTS_ARTIST });
  });

  it('cria 4 slots (title + artist + 2 feat) para track com 2 feats', () => {
    const slots = buildSlotsForTrack({
      title: 'Lean On',
      artists: ['Major Lazer', 'DJ Snake', 'MØ'],
    });
    expect(slots).toHaveLength(4);
    expect(slots.map((s) => s.kind)).toEqual(['title', 'artist', 'feat', 'feat']);
    expect(slots.filter((s) => s.kind === 'feat')).toEqual([
      expect.objectContaining({ display: 'DJ Snake', basePoints: POINTS_FEAT }),
      expect.objectContaining({ display: 'MØ', basePoints: POINTS_FEAT }),
    ]);
  });

  it('ignora artists com string vazia (não cria slot)', () => {
    const slots = buildSlotsForTrack({
      title: 'X',
      artists: ['Solo Artist', '', '   '],
    });
    expect(slots).toHaveLength(2); // title + 1 artist; vazios ignorados
  });
});

describe('classifyGuess', () => {
  const slots: Slot[] = buildSlotsForTrack({
    title: 'Negro Drama',
    artists: ["Racionais MC's", 'Mano Brown'],
  });

  it('acerta título com texto exato', () => {
    const result = classifyGuess('Negro Drama', slots);
    expect(result?.slot.kind).toBe('title');
  });

  it('acerta artista principal', () => {
    const result = classifyGuess("Racionais MC's", slots);
    expect(result?.slot.kind).toBe('artist');
  });

  it('acerta slot de feat', () => {
    const result = classifyGuess('Mano Brown', slots);
    expect(result?.slot.kind).toBe('feat');
  });

  it('retorna null se slot não está disponível (filled fora da lista)', () => {
    // Caller filtra slots disponíveis. Se passar lista sem o slot do título:
    const semTitle = slots.filter((s) => s.kind !== 'title');
    expect(classifyGuess('Negro Drama', semTitle)).toBeNull();
  });

  it('retorna null em guess errado', () => {
    expect(classifyGuess('Música qualquer', slots)).toBeNull();
  });

  it('normaliza: ignora acentos e caso', () => {
    const tracks = buildSlotsForTrack({
      title: 'Não Vou Me Adaptar',
      artists: ['Titãs'],
    });
    expect(classifyGuess('nao vou me adaptar', tracks)?.slot.kind).toBe('title');
    expect(classifyGuess('TITAS', tracks)?.slot.kind).toBe('artist');
  });
});
