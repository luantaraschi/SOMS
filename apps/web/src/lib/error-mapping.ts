import type { ServerErrorCode } from '@soms/shared';

export type ErrorKind = '404' | 'kicked' | 'down';

export function mapServerErrorToKind(code: ServerErrorCode | string): ErrorKind {
  switch (code) {
    case 'ROOM_NOT_FOUND':
    case 'ROOM_DESTROYED':
    case 'ROOM_IN_PROGRESS':
    case 'ROOM_FULL':
      return '404';
    case 'KICKED':
      return 'kicked';
    case 'DISCONNECTED':
    case 'CONNECTION_ERROR':
    default:
      return 'down';
  }
}
