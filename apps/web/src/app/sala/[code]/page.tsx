'use client';

import { use } from 'react';
import { LobbyView } from '@/components/lobby/LobbyView';
import { SmButton, SmCard } from '@/components/primitives';
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
    return <LobbyError code={code} status={connectionStatus} />;
  }

  return <LobbyView snapshot={snapshot} />;
}

function LobbyLoading({ code }: { code: string }): React.ReactElement {
  return (
    <main className="paper min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <p className="t-label mb-4">CONECTANDO</p>
        <p className="t-display t-mono">{code}</p>
      </div>
    </main>
  );
}

function LobbyError({
  code,
  status,
}: {
  code: string;
  status: string;
}): React.ReactElement {
  return (
    <main className="paper min-h-screen flex items-center justify-center p-8">
      <SmCard tilt="l" className="p-8 max-w-md">
        <p className="t-h2">conexão perdida</p>
        <p className="text-ink-soft mt-2">
          tentando reconectar... ({status})
        </p>
        <p className="t-caption t-mono mt-2">{code}</p>
        <div className="mt-4">
          <SmButton variant="ghost" onClick={() => window.location.reload()}>
            recarregar
          </SmButton>
        </div>
      </SmCard>
    </main>
  );
}
