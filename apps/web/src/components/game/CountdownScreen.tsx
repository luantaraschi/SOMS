'use client';

import { useEffect, useState } from 'react';
import { SmBrand } from '@/components/primitives';
import { useGame } from '@/stores/game';

/**
 * Tela exibida durante `preparing` (pre-load Deezer) e `countdown` (3...2...1).
 * Conta segundos restantes a partir de `countdownEndsAt` (timestamp absoluto
 * vindo do server) — tolerante a delay de rede e drift mínimo.
 */
export function CountdownScreen(): React.ReactElement {
  const phase = useGame((s) => s.phase);
  const countdownEndsAt = useGame((s) => s.countdownEndsAt);
  const currentRound = useGame((s) => s.currentRound);
  const finalResults = useGame((s) => s.finalResults);

  const [secondsLeft, setSecondsLeft] = useState<number>(3);

  useEffect(() => {
    if (phase !== 'countdown' || countdownEndsAt === null) return;
    function update(): void {
      const remaining = Math.max(
        0,
        Math.ceil(((countdownEndsAt ?? 0) - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);
    }
    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, [phase, countdownEndsAt]);

  const isPreparing = phase === 'preparing';
  const totalRounds = currentRound?.totalRounds ?? finalResults?.totalRounds;

  return (
    <main className="paper min-h-screen flex items-center justify-center p-8">
      <div className="text-center flex flex-col items-center gap-10">
        <SmBrand size="md" />
        <div>
          <p className="t-label" style={{ marginBottom: 8 }}>
            {isPreparing ? 'preparando partida' : 'começando em'}
          </p>
          {isPreparing ? (
            <p className="t-display">carregando músicas...</p>
          ) : (
            <p
              className="t-mega t-mono"
              style={{
                fontVariantNumeric: 'tabular-nums',
                transform: 'rotate(-2deg)',
                display: 'inline-block',
              }}
            >
              {secondsLeft}
            </p>
          )}
        </div>
        {totalRounds ? (
          <p className="t-caption" style={{ color: 'var(--ink-soft)' }}>
            {totalRounds} rounds
          </p>
        ) : null}
      </div>
    </main>
  );
}
