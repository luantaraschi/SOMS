import { use } from 'react';

/**
 * Placeholder do lobby — substituído por implementação real em C3.
 * Pra C2, só renderiza o code recebido pra confirmar que o router.push
 * funcionou e o auth/join client-side completou.
 */
export default function LobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}): React.ReactElement {
  const { code } = use(params);
  return (
    <main className="paper flex items-center justify-center p-8">
      <div className="text-center">
        <p className="t-label" style={{ color: 'var(--ink-soft)' }}>
          código da sala
        </p>
        <p className="t-mega t-mono mt-2">{code.toUpperCase()}</p>
        <p className="mt-8 t-caption">
          lobby em construção. próximo bloco do sprint.
        </p>
      </div>
    </main>
  );
}
