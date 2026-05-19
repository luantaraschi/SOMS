'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LobbyView } from '@/components/lobby/LobbyView';
import { EmptyState } from '@/components/screens/EmptyState';
import { ErrorScreen } from '@/components/screens/ErrorScreen';
import { SmBrand } from '@/components/primitives';
import { useLobbyConnection } from '@/hooks/useLobbyConnection';
import { useRoom } from '@/stores/room';

const GAME_STATUSES = new Set(['countdown', 'playing', 'reveal', 'ended']);

export default function LobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}): React.ReactElement {
  const { code: rawCode } = use(params);
  const code = rawCode.toUpperCase();
  const router = useRouter();

  useLobbyConnection(code);

  const snapshot = useRoom((s) => s.snapshot);
  const connectionStatus = useRoom((s) => s.connectionStatus);

  // Host iniciou partida (lobby→countdown) ou reconectamos mid-game →
  // redireciona pra rota /jogar. O caminho reverso (jogar→lobby após
  // room:return_to_lobby) é feito dentro de /jogar/page.tsx.
  useEffect(() => {
    if (snapshot && GAME_STATUSES.has(snapshot.status)) {
      router.replace(`/sala/${code}/jogar`);
    }
  }, [snapshot, code, router]);

  if (connectionStatus === 'connecting' || !snapshot) {
    return <LobbyLoading code={code} />;
  }

  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    return <LobbyError />;
  }

  return (
    <LobbyView
      snapshot={snapshot}
      emptyState={snapshot.players.length === 1 ? <EmptyState /> : null}
    />
  );
}

function LobbyLoading({ code }: { code: string }): React.ReactElement {
  return (
    <main className="paper min-h-screen flex items-center justify-center p-8">
      <div className="text-center flex flex-col items-center gap-8">
        <SmBrand size="md" />
        <div>
          <p className="t-label mb-2">conectando</p>
          <p className="t-display t-mono">{code}</p>
        </div>
      </div>
    </main>
  );
}

function LobbyError(): React.ReactElement {
  const router = useRouter();
  return (
    <ErrorScreen
      kind="down"
      onPrimary={() => window.location.reload()}
      secondaryAction={{ label: 'Voltar pra Home', onClick: () => router.push('/') }}
    />
  );
}
