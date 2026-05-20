'use client';

import { ArrowRight, Music } from 'lucide-react';
import { useState } from 'react';
import { SmButton } from '@/components/primitives';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/stores/game';
import { useIdentity } from '@/stores/identity';
import { useRoom } from '@/stores/room';

/**
 * Tela entre rounds. Mostra capa, título, artistas, década, ranking parcial
 * com delta (calculado vs rounds anteriores), e botão "próximo round" pro host.
 *
 * Auto-advance: round-runner.ts agenda nextRound após REVEAL_DURATION_MS.
 * Host pode forçar antes via room:return_to_lobby... espera, na verdade é
 * game:ready_next_round. (room:return_to_lobby é só pro fim de partida.)
 */
export function RevealScreen(): React.ReactElement {
  const lastReveal = useGame((s) => s.lastReveal);
  const scores = useGame((s) => s.scores);
  const snapshot = useRoom((s) => s.snapshot);
  const userId = useIdentity((s) => s.userId);
  const nickname = useIdentity((s) => s.nickname);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!lastReveal || !snapshot) {
    return (
      <main className="paper min-h-screen flex items-center justify-center p-8">
        <p className="t-label">aguardando revelação</p>
      </main>
    );
  }

  const isHost = snapshot.hostUserId === userId;
  const track = lastReveal.track;

  // Resolve nicknames dos players atuais
  const playerByUserId = new Map(
    snapshot.players.map((p) => [p.userId, p.nickname]),
  );

  // Ranking ordenado por total. Delta seria total - (total - thisRoundPts);
  // server manda só scoresSnapshot final. Pra Sprint 1, mostramos o total.
  // (delta = polimento posterior, exigiria diff entre revelações.)
  const ranking = [...lastReveal.scoresSnapshot].sort(
    (a, b) => b.totalPoints - a.totalPoints,
  );

  function nextRound(): void {
    if (!userId || !nickname || pending) return;
    setPending(true);
    setError(null);
    const socket = getSocket({ userId, nickname });
    socket.emit('game:ready_next_round', (ack) => {
      setPending(false);
      if (!ack.ok) {
        setError(ack.error?.message ?? 'não consegui avançar.');
      }
    });
  }

  return (
    <main
      className="paper min-h-screen p-6"
      style={{ maxWidth: 880, margin: '0 auto', paddingBottom: 80 }}
    >
      <div className="text-center" style={{ marginBottom: 20 }}>
        <div className="sm-label">
          round {lastReveal.roundIndex + 1} · revelação
        </div>
        <h1
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 56,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            lineHeight: 1,
            transform: 'rotate(-1deg)',
            display: 'inline-block',
          }}
        >
          A música era…
        </h1>
      </div>

      <div
        className="reveal-grid"
        style={{
          display: 'grid',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div
          className="reveal-cover"
          style={{
            width: '100%',
            maxWidth: 280,
            aspectRatio: '1 / 1',
            background: 'var(--secondary)',
            border: '4px solid var(--ink)',
            borderRadius: 24,
            boxShadow: '12px 12px 0 0 var(--shadow-color)',
            transform: 'rotate(-1.5deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: track.coverUrl ? `url(${track.coverUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!track.coverUrl ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'repeating-linear-gradient(45deg, #00000022 0 8px, transparent 8px 16px)',
                }}
              />
              <Music size={96} strokeWidth={2.5} style={{ position: 'relative' }} />
            </>
          ) : null}
        </div>

        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 44,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            {track.title}
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: 'var(--font-body)',
              fontSize: 22,
              color: 'var(--ink-soft)',
            }}
          >
            {track.artists.join(', ')}
            {track.releaseYear ? (
              <>
                {' · '}
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {track.releaseYear}
                </span>
              </>
            ) : null}
          </div>

          <div style={{ marginTop: 24 }}>
            <div className="sm-label" style={{ marginBottom: 10 }}>
              ranking
            </div>
            <div className="flex flex-col gap-2.5">
              {ranking.map((entry, i) => {
                const name = playerByUserId.get(entry.userId) ?? '???';
                return (
                  <div
                    key={entry.userId}
                    style={{
                      background:
                        i === 0 ? 'var(--success)' : 'var(--surface)',
                      border: '3px solid var(--ink)',
                      borderRadius: 12,
                      boxShadow: '4px 4px 0 0 var(--shadow-color)',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transform: `rotate(${i % 2 ? 0.5 : -0.5}deg)`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 900,
                        fontSize: 16,
                        width: 26,
                      }}
                    >
                      {i + 1}º
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: 18,
                        textTransform: 'lowercase',
                        flex: 1,
                      }}
                    >
                      {name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: 18,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {entry.totalPoints}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* scores Map também pode estar atualizado mais recente; mostra ele
                se diferir do snapshot da reveal. Por agora só usamos o reveal. */}
            {scores.size === 0 ? null : null}
          </div>
        </div>
      </div>

      {isHost ? (
        <div
          style={{
            marginTop: 36,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <SmButton
            variant="primary"
            size="lg"
            onClick={nextRound}
            disabled={pending}
          >
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <ArrowRight size={20} strokeWidth={2.8} />
              {pending ? 'AVANÇANDO...' : 'PRÓXIMO ROUND'}
            </span>
          </SmButton>
          {error ? (
            <p
              className="t-caption italic"
              style={{ color: 'var(--danger)' }}
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
