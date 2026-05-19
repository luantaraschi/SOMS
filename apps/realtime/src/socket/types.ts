import type { ClientToServerEvents, ServerToClientEvents } from '@soms/shared';
import type { Server, Socket } from 'socket.io';
import type { SocketData } from './socket-data.js';

type InterServerEvents = Record<string, never>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
