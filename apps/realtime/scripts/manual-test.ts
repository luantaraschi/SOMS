/**
 * Cliente ad-hoc pra testar o realtime na mão.
 *
 * Uso:
 *   pnpm --filter @soms/realtime exec tsx scripts/manual-test.ts
 *
 * Pré-condição: server rodando em http://localhost:8080 (pnpm realtime:dev).
 *
 * O script:
 *   1. conecta como "memi"
 *   2. cria uma sala
 *   3. conecta um 2º cliente "bob" e faz join
 *   4. transfere host pra bob
 *   5. desconecta tudo
 *
 * Pra testar reconexão automática, mude `RUN_RECONNECT` pra true: o 2º cliente
 * desconecta abruptamente, espera 2s, e reconecta com o mesmo userId. Deve
 * receber `room:snapshot` automaticamente.
 */
import { randomUUID } from 'node:crypto';
import type {
  RoomCreateAck,
  RoomJoinAck,
  RoomSnapshot,
  RoomTransferHostAck,
} from '@soms/shared';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';

const URL = process.env.REALTIME_URL ?? 'http://localhost:8080';
const RUN_RECONNECT = process.env.RUN_RECONNECT === '1';

function connect(userId: string, nickname: string): ClientSocket {
  return ioClient(URL, {
    transports: ['websocket'],
    reconnection: false,
    auth: { userId, nickname },
  });
}

function emitAck<T>(c: ClientSocket, event: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`ack "${event}" timeout`)), 3_000);
    c.emit(event, ...args, (res: T) => {
      clearTimeout(t);
      resolve(res);
    });
  });
}

function waitForConnect(c: ClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('connect timeout')), 3_000);
    c.once('connect_error', (err) => {
      clearTimeout(t);
      reject(err);
    });
    c.once('connect', () => {
      clearTimeout(t);
      resolve();
    });
  });
}

async function main(): Promise<void> {
  const memiUserId = randomUUID();
  const bobUserId = randomUUID();

  console.log('→ conectando memi (host)...');
  const memi = connect(memiUserId, 'memi');
  await waitForConnect(memi);
  console.log('  ok');

  console.log('→ criando sala...');
  const createAck = await emitAck<RoomCreateAck>(memi, 'room:create', {
    settings: {
      totalRounds: 5,
      roundDurationSeconds: 30,
      trackSource: { type: 'genre_decade', genres: ['pop'], decades: [2010] },
    },
  });
  if (!createAck.ok) throw new Error(`create failed: ${createAck.error.code}`);
  console.log(`  ok — code: ${createAck.code}`);

  console.log('→ conectando bob...');
  const bob = connect(bobUserId, 'bob');
  await waitForConnect(bob);
  bob.on('room:snapshot', (snap: RoomSnapshot) => {
    console.log('  bob recebeu snapshot:', snap.code);
  });
  console.log('  ok');

  console.log(`→ bob faz join em ${createAck.code}...`);
  const joinAck = await emitAck<RoomJoinAck>(bob, 'room:join', { code: createAck.code });
  if (!joinAck.ok) throw new Error(`join failed: ${joinAck.error.code}`);
  console.log(`  ok — ${joinAck.snapshot.players.length} players na sala`);

  console.log('→ memi transfere host pra bob...');
  const txAck = await emitAck<RoomTransferHostAck>(memi, 'room:transfer_host', {
    newHostUserId: bobUserId,
  });
  if (!txAck.ok) throw new Error(`transfer failed: ${txAck.error?.code}`);
  console.log('  ok');

  if (RUN_RECONNECT) {
    console.log('→ bob desconecta abruptamente...');
    bob.disconnect();
    await new Promise((r) => setTimeout(r, 2_000));

    console.log('→ bob reconecta...');
    const bob2 = connect(bobUserId, 'bob');
    bob2.on('room:snapshot', (snap: RoomSnapshot) => {
      console.log(
        `  bob2 recebeu snapshot da sala ${snap.code} (host: ${snap.hostUserId === bobUserId ? 'bob (eu)' : 'outro'})`,
      );
    });
    await waitForConnect(bob2);
    await new Promise((r) => setTimeout(r, 1_000));
    bob2.disconnect();
  }

  memi.disconnect();
  bob.disconnect();
  console.log('→ done.');
}

main().catch((err: unknown) => {
  console.error('FATAL:', err);
  process.exit(1);
});
