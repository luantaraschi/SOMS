'use client';

import { useState } from 'react';
import { SmButton, SmCard } from '@/components/primitives';

export function RoomCodeHero({ code }: { code: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    const url = `${window.location.origin}/sala/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3_000);
  }

  return (
    <SmCard hero tilt="l" className="w-full max-w-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="t-label mb-1" style={{ color: 'var(--ink-soft)' }}>
            código da sala
          </p>
          <p className="t-display t-mono">{code}</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <SmButton variant="ghost" onClick={handleCopy}>
            copiar
          </SmButton>
          {copied ? (
            <p className="t-caption italic" style={{ color: 'var(--success)' }}>
              copiado!
            </p>
          ) : null}
        </div>
      </div>
    </SmCard>
  );
}
