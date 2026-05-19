import type { ClientToServerEvents, ServerToClientEvents } from '@soms/shared';
import { io, type Socket } from 'socket.io-client';

const REALTIME_URL =
  process.env.NEXT_PUBLIC_REALTIME_URL ?? 'http://localhost:8080';

/**
 * Tipo do socket cliente: ServerToClient vem 1º (eventos que o servidor envia
 * pra cá), ClientToServer 2º (eventos que esta ponta emite).
 *
 * Cuidado: a ordem do generic do socket.io-client é INVERSA da ordem do
 * Socket.IO server. No server: `Socket<ClientToServer, ServerToClient, ...>`.
 */
export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export type ConnectAuth = {
  userId: string;
  nickname: string;
};

export function getSocket(auth: ConnectAuth): TypedSocket {
  if (socket) return socket;
  socket = io(REALTIME_URL, {
    auth,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
