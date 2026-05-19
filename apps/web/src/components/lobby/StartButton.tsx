'use client';

import { useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useIdentity } from '@/stores/identity';
import { SmButton } from '@/components/primitives';

type StartButtonProps = {
  disabled: boolean;
  playerCount: number;
};

export function StartButton({
  disabled,
  playerCount,
}: StartButtonProps): React.ReactElement {
  const userId = useIdentity((s) => s.userId);
  const nickname = useIdentity((s) => s.nickname);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart(): Promise<void> {
    if (!userId || !nickname || pending) return;
    setPending(true);
    setError(null);
    const socket = getSocket({ userId, nickname });
    socket.emit('game:start', (ack) => {
      if (!ack.ok) {
        setError(ack.error?.message ?? 'não consegui iniciar a partida.');
      }
      setPending(false);
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <SmButton
        variant="primary"
        size="lg"
        onClick={handleStart}
        disabled={disabled || pending || playerCount < 1}
      >
        {pending ? 'INICIANDO...' : 'INICIAR PARTIDA'}
      </SmButton>
      {error ? (
        <p className="t-caption italic" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
