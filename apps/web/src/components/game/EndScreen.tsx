'use client';

import { Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SmButton } from '@/components/primitives';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/stores/game';
import { useIdentity } from '@/stores/identity';
import { useRoom } from '@/stores/room';
import { PodiumColumn } from './PodiumColumn';

/**
 * Pódio + ranking + ações. Pra Sprint 1, sem estatísticas engraçadas
 * (precisa de dados que o server ainda não calcula — bloco D ou Sprint 2).
 *
 * Host vê "JOGAR DE NOVO" → emite room:return_to_lobby → server transiciona
 * pra lobby → lobby page recebe room:status:changed e renderiza o lobby.
 * Não-host vê "VOLTAR PRA HOME" só.
 */
export function EndScreen(): React.ReactElement {
  const router = useRouter();
  const finalResults = useGame((s) => s.finalResults);
  const snapshot = useRoom((s) => s.snapshot);
  const userId = useIdentity((s) => s.userId);
  const nickname = useIdentity((s) => s.nickname);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!finalResults || !snapshot) {
    return (
      <main className="paper min-h-screen flex items-center justify-center p-8">
        <p className="t-label">calculando resultado</p>
      </main>
    );
  }

  const isHost = snapshot.hostUserId === userId;
  const playerByUserId = new Map(
    snapshot.players.map((p) => [p.userId, p.nickname]),
  );

  const podiumEntries = finalResults.ranking.slice(0, 3).map((r) => ({
    userId: r.userId,
    name: playerByUserId.get(r.userId) ?? '???',
    score: r.totalPoints,
  }));
  const rest = finalResults.ranking.slice(3).map((r) => ({
    userId: r.userId,
    name: playerByUserId.get(r.userId) ?? '???',
    score: r.totalPoints,
  }));

  function playAgain(): void {
    if (!userId || !nickname || pending) return;
    setPending(true);
    setError(null);
    const socket = getSocket({ userId, nickname });
    socket.emit('room:return_to_lobby', (ack) => {
      setPending(false);
      if (!ack.ok) {
        setError(ack.error?.message ?? 'não consegui voltar pra sala.');
      }
      // Em sucesso, o status:changed → lobby vai redirecionar via /jogar/page.tsx.
    });
  }

  function goHome(): void {
    router.push('/');
  }

  return (
    <main
      className="paper min-h-screen p-6"
      style={{ maxWidth: 980, margin: '0 auto', paddingBottom: 80 }}
    >
      <div className="text-center" style={{ marginBottom: 36 }}>
        <div className="sm-label">fim de partida</div>
        <h1
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 64,
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
            lineHeight: 1,
            transform: 'rotate(-1.5deg)',
            display: 'inline-block',
          }}
        >
          Pódio
        </h1>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: 36,
          marginBottom: 48,
          flexWrap: 'wrap',
        }}
      >
        {podiumEntries[1] ? (
          <PodiumColumn
            rank={2}
            name={podiumEntries[1].name}
            score={podiumEntries[1].score}
            color="var(--secondary)"
            textColor="#fff"
            tilt={2}
          />
        ) : null}
        {podiumEntries[0] ? (
          <PodiumColumn
            rank={1}
            name={podiumEntries[0].name}
            score={podiumEntries[0].score}
            color="var(--primary)"
            tilt={-2}
          />
        ) : null}
        {podiumEntries[2] ? (
          <PodiumColumn
            rank={3}
            name={podiumEntries[2].name}
            score={podiumEntries[2].score}
            color="var(--info)"
            tilt={-1.5}
          />
        ) : null}
      </div>

      {rest.length > 0 ? (
        <div style={{ marginBottom: 48 }}>
          <div className="sm-label" style={{ marginBottom: 12 }}>
            resto do ranking
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {rest.map((p, i) => (
              <div
                key={p.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'var(--surface)',
                  border: '3px solid var(--ink)',
                  borderRadius: 12,
                  boxShadow: '4px 4px 0 0 var(--shadow-color)',
                  padding: '10px 14px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: 16,
                    width: 32,
                  }}
                >
                  {i + 4}º
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 17,
                    textTransform: 'lowercase',
                    flex: 1,
                  }}
                >
                  {p.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 16,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {p.score.toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: 'flex',
          gap: 14,
          justifyContent: 'center',
          flexWrap: 'wrap',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 14,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {isHost ? (
            <SmButton
              variant="primary"
              size="lg"
              onClick={playAgain}
              disabled={pending}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Play size={20} strokeWidth={2.8} />
                {pending ? 'VOLTANDO...' : 'JOGAR DE NOVO'}
              </span>
            </SmButton>
          ) : null}
          <SmButton variant="secondary" size="lg" onClick={goHome}>
            voltar pra home
          </SmButton>
        </div>
        {error ? (
          <p
            className="t-caption italic"
            style={{ color: 'var(--danger)' }}
          >
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
