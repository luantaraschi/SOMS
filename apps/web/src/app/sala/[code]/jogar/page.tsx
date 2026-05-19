'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CountdownScreen } from '@/components/game/CountdownScreen';
import { EndScreen } from '@/components/game/EndScreen';
import { PlayingScreen } from '@/components/game/PlayingScreen';
import { RevealScreen } from '@/components/game/RevealScreen';
import { SmBrand } from '@/components/primitives';
import { useGameConnection } from '@/hooks/useGameConnection';
import { useLobbyConnection } from '@/hooks/useLobbyConnection';
import { useGame } from '@/stores/game';
import { useRoom } from '@/stores/room';

/**
 * Wrapper das fases de jogo. Roteia pela `phase` do useGame, mas também
 * observa `snapshot.status` da sala — se voltar pra `lobby`, redireciona
 * pro lobby (cenário pós room:return_to_lobby).
 */
export default function PlayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}): React.ReactElement {
  const { code: rawCode } = use(params);
  const code = rawCode.toUpperCase();
  const router = useRouter();

  useLobbyConnection(code);
  useGameConnection(code);

  const snapshot = useRoom((s) => s.snapshot);
  const phase = useGame((s) => s.phase);

  // Sala voltou pra lobby (host clicou "jogar de novo") → volta pro lobby.
  useEffect(() => {
    if (snapshot?.status === 'lobby') {
      useGame.getState().reset();
      router.replace(`/sala/${code}`);
    }
  }, [snapshot?.status, code, router]);

  if (!snapshot) {
    return (
      <main className="paper min-h-screen flex items-center justify-center p-8">
        <div className="text-center flex flex-col items-center gap-8">
          <SmBrand size="md" />
          <p className="t-label">conectando</p>
        </div>
      </main>
    );
  }

  // Fase do server preferida pra status iniciais, fase local pro estado vivo.
  // Server status='countdown' mas phase='idle' (ainda não chegou game:countdown):
  // mostra CountdownScreen via fallback de status.
  if (phase === 'ended') return <EndScreen />;
  if (phase === 'reveal') return <RevealScreen />;
  if (phase === 'playing') return <PlayingScreen />;
  if (phase === 'countdown' || phase === 'preparing') return <CountdownScreen />;

  // Fallback: usa o snapshot.status enquanto eventos game:* não chegaram ainda
  if (snapshot.status === 'countdown') return <CountdownScreen />;
  if (snapshot.status === 'playing') return <CountdownScreen />;
  if (snapshot.status === 'reveal') return <CountdownScreen />;
  if (snapshot.status === 'ended') {
    return (
      <main className="paper min-h-screen flex items-center justify-center p-8">
        <p className="t-label">partida encerrada</p>
      </main>
    );
  }

  return (
    <main className="paper min-h-screen flex items-center justify-center p-8">
      <p className="t-label">aguardando partida</p>
    </main>
  );
}
