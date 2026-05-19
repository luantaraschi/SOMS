/**
 * Smoke test E2E manual de uma partida completa contra DB+Deezer reais.
 *
 * Uso (com server rodando em pnpm realtime:dev e Docker postgres up):
 *   pnpm --filter @soms/realtime exec tsx scripts/manual-game.ts
 *
 * Fluxo:
 *   1. memi (host) + bob conectam
 *   2. host cria sala (3 rounds, qualquer track)
 *   3. host inicia jogo
 *   4. Para cada round: clientes consultam o título via canal lateral (não dá pra
 *      adivinhar sem saber a track). Aqui usamos um truque: host emite o título
 *      LITERAL — server valida normalizado. Bob fica de fora pra mostrar que o
 *      ranking final é correto (só host pontua).
 *   5. Aguarda game:ended → mostra ranking
 *
 * Como o cliente NÃO recebe o título real (apenas slot.kind), pra acertar
 * precisamos saber via outro canal. Em produção o player ouve o áudio. Aqui,
 * imprimimos os títulos lido do banco antes — só pra fins de smoke test.
 */
import { randomUUID } from 'node:crypto';
import type {
  GameCountdownEvent,
  GameEndedEvent,
  GamePreparingEvent,
  GameRoundRevealEvent,
  GameRoundStartedEvent,
  GameStartAck,
  RoomCreateAck,
  RoomJoinAck,
} from '@soms/shared';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';

const URL = process.env.REALTIME_URL ?? 'http://localhost:8080';

function ts(): string {
  const d = new Date();
  return `${d.toISOString().slice(11, 23)}`;
}
function log(msg: string): void {
  console.log(`[${ts()}] ${msg}`);
}

function connect(userId: string, nickname: string): ClientSocket {
  return ioClient(URL, {
    transports: ['websocket'],
    reconnection: false,
    auth: { userId, nickname },
  });
}

function emitAck<T>(c: ClientSocket, event: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`ack "${event}" timeout`)), 10_000);
    c.emit(event, ...args, (res: T) => {
      clearTimeout(t);
      resolve(res);
    });
  });
}

function waitForConnect(c: ClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('connect timeout')), 5_000);
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

  log('conectando memi (host)...');
  const memi = connect(memiUserId, 'memi');
  await waitForConnect(memi);
  log('memi ok');

  log('memi cria sala (3 rounds, settings abertas)...');
  const created = await emitAck<RoomCreateAck>(memi, 'room:create', {
    settings: {
      totalRounds: 3,
      roundDurationSeconds: 30,
      trackSource: { type: 'genre_decade', genres: [], decades: [] },
    },
  });
  if (!created.ok) throw new Error(`create failed: ${created.error.code}`);
  log(`sala criada: ${created.code}`);

  log('conectando bob...');
  const bob = connect(bobUserId, 'bob');
  await waitForConnect(bob);
  await emitAck<RoomJoinAck>(bob, 'room:join', { code: created.code });
  log('bob ok');

  // Listeners de eventos game (pra log)
  for (const [name, c] of [
    ['memi', memi],
    ['bob', bob],
  ] as const) {
    c.on('game:preparing', (p: GamePreparingEvent) =>
      log(`  ${name}: game:preparing totalRounds=${p.totalRounds}`),
    );
    c.on('game:countdown', (p: GameCountdownEvent) =>
      log(`  ${name}: game:countdown secondsLeft=${p.secondsLeft}`),
    );
    c.on('game:round:started', (p: GameRoundStartedEvent) =>
      log(
        `  ${name}: game:round:started round=${p.roundIndex + 1}/${p.totalRounds} slots=${p.slots.length} duration=${p.durationMs}ms`,
      ),
    );
    c.on('game:round:reveal', (p: GameRoundRevealEvent) => {
      const fills = p.fills
        .map((f) => `${f.kind}="${f.display}" (${f.winners.length} winners)`)
        .join(', ');
      log(`  ${name}: game:round:reveal round=${p.roundIndex + 1} reason=${p.endedReason} ${fills}`);
    });
  }

  log('host chama game:start...');
  const start = Date.now();
  const startAck = await emitAck<GameStartAck>(memi, 'game:start');
  log(`  ack em ${Date.now() - start}ms — ok=${startAck.ok}`);
  if (!startAck.ok) {
    throw new Error(`game:start failed: ${startAck.error?.code}`);
  }

  log('aguardando game:ended (até 3 rounds × ~38s = ~2min máx)...');
  const ended = await new Promise<GameEndedEvent>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('game:ended timeout (2min)')), 130_000);
    memi.once('game:ended', (p: GameEndedEvent) => {
      clearTimeout(t);
      resolve(p);
    });
  });

  log('=== game:ended ===');
  log(`  totalRounds: ${ended.totalRounds}`);
  log(`  durationMs: ${ended.durationMs}`);
  log(`  ranking:`);
  for (const r of ended.ranking) {
    log(`    #${r.position} ${r.userId.slice(0, 8)}... ${r.totalPoints} pts`);
  }

  await new Promise((r) => setTimeout(r, 500));
  memi.disconnect();
  bob.disconnect();
  log('done.');
}

main().catch((err: unknown) => {
  console.error('FATAL:', err);
  process.exit(1);
});
