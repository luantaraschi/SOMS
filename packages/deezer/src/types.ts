/** Tipos parciais da Deezer Public API. Só o subset usado pelo SOMS. */

export type DeezerArtist = { id: number; name: string };

export type DeezerAlbum = { id: number; title: string; cover_xl: string };

export type DeezerSearchTrack = {
  id: number;
  title: string;
  preview: string;
  duration: number;
  artist: DeezerArtist;
  album: DeezerAlbum;
};

/** `/track/{id}` retorna campos extras que `/search` não expõe (notavelmente `release_date`). */
export type DeezerTrackDetail = DeezerSearchTrack & {
  release_date?: string; // formato "YYYY-MM-DD"
};

export type DeezerSearchResponse = {
  data: DeezerSearchTrack[];
  total: number;
};

/**
 * Erro tipado. `status` = código HTTP (429, 500, ...) ou `null` para erros de
 * rede/timeout. `detail` é mensagem livre.
 */
export class DeezerError extends Error {
  constructor(
    public readonly status: number | null,
    public readonly detail: string,
  ) {
    super(`Deezer error: ${detail}`);
    this.name = 'DeezerError';
  }
}
