'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { LobbyView } from '@/components/lobby/LobbyView';
import { EmptyState } from '@/components/screens/EmptyState';
import { ErrorScreen } from '@/components/screens/ErrorScreen';
import { SmBrand } from '@/components/primitives';
import { useLobbyConnection } from '@/hooks/useLobbyConnection';
import { useRoom } from '@/stores/room';

export default function LobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}): React.ReactElement {
  const { code: rawCode } = use(params);
  const code = rawCode.toUpperCase();

  useLobbyConnection(code);

  const snapshot = useRoom((s) => s.snapshot);
  const connectionStatus = useRoom((s) => s.connectionStatus);

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
