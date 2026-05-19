import { insufficientTracksMessage, type ServerError } from '@soms/shared';
import type { PreloadError, SelectTracksError } from '../game/index.js';
import type { RoomError } from '../rooms/types.js';

/**
 * Mapeia erros internos do RoomManager pra `ServerError` over-the-wire.
 * Mensagens em pt-BR, lowercase (voz SOMS).
 */
export function mapRoomErrorToServerError(err: RoomError): ServerError {
  switch (err.code) {
    case 'ROOM_NOT_FOUND':
      return { code: 'ROOM_NOT_FOUND', message: 'sala não encontrada.' };
    case 'ROOM_FULL':
      return {
        code: 'ROOM_FULL',
        message: `sala lotada (máximo ${err.max} jogadores).`,
        details: { max: err.max },
      };
    case 'NICKNAME_TAKEN':
      return {
        code: 'NICKNAME_TAKEN',
        message: `o apelido "${err.nickname}" já está em uso nessa sala.`,
        details: { nickname: err.nickname },
      };
    case 'NICKNAME_INVALID':
      return {
        code: 'NICKNAME_INVALID',
        message: 'apelido inválido. use 2 a 20 caracteres, sem espaços só.',
        details: { reason: err.reason },
      };
    case 'ROOM_IN_PROGRESS':
      return {
        code: 'ROOM_IN_PROGRESS',
        message: 'a partida já começou. espera essa terminar.',
      };
    case 'ROOM_ENDED':
      return { code: 'ROOM_ENDED', message: 'essa partida já acabou.' };
    case 'NOT_HOST':
      return { code: 'NOT_HOST', message: 'só o host pode fazer isso.' };
    case 'PLAYER_NOT_IN_ROOM':
      return {
        code: 'PLAYER_NOT_IN_ROOM',
        message: 'esse jogador não está na sala.',
      };
    case 'PLAYER_ALREADY_IN_ROOM':
      return {
        code: 'PLAYER_ALREADY_IN_ROOM',
        message: 'você já está em outra sala. saia primeiro.',
      };
    case 'INVALID_STATUS_TRANSITION':
      return {
        code: 'INVALID_STATUS_TRANSITION',
        message: 'transição de estado inválida.',
        details: { from: err.from, to: err.to },
      };
    case 'HOST_TRANSFER_NOT_ALLOWED':
      return {
        code: 'HOST_TRANSFER_NOT_ALLOWED',
        message: 'só dá pra passar host no lobby.',
        details: { reason: err.reason },
      };
    case 'CANNOT_KICK_SELF':
      return {
        code: 'CANNOT_KICK_SELF',
        message: 'não dá pra expulsar você mesmo. saia pelo botão.',
      };
    case 'CANNOT_TRANSFER_TO_SELF':
      return {
        code: 'CANNOT_TRANSFER_TO_SELF',
        message: 'você já é o host.',
      };
  }
}

export function mapSelectErrorToServerError(err: SelectTracksError): ServerError {
  switch (err.code) {
    case 'INSUFFICIENT_TRACKS':
      return {
        code: 'INSUFFICIENT_TRACKS',
        message: insufficientTracksMessage(err.available),
        details: { available: err.available, requested: err.requested },
      };
    case 'NO_TRACKS_MATCHED':
      return {
        code: 'INSUFFICIENT_TRACKS',
        message: insufficientTracksMessage(0),
      };
  }
}

export function mapPreloadErrorToServerError(err: PreloadError): ServerError {
  switch (err.code) {
    case 'DEEZER_UNAVAILABLE':
      return {
        code: 'DEEZER_UNAVAILABLE_FOR_START',
        message: 'o deezer não tá respondendo agora. tenta de novo em alguns segundos.',
      };
    case 'INSUFFICIENT_FRESH_TRACKS':
      return {
        code: 'INSUFFICIENT_TRACKS',
        message: `algumas músicas saíram do ar. consegui só ${err.got} de ${err.needed}. tenta com mais gêneros ou décadas.`,
        details: { got: err.got, needed: err.needed },
      };
  }
}
