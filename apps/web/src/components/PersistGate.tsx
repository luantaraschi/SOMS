'use client';

import { useEffect } from 'react';
import { useIdentity } from '@/stores/identity';

/**
 * Dispara rehydration explícita do persist do Zustand assim que o cliente
 * monta. Ver `skipHydration: true` em stores/identity.ts. D-P3.
 *
 * Renderiza children direto — só side-effect.
 */
export function PersistGate({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  useEffect(() => {
    void useIdentity.persist.rehydrate();
  }, []);
  return <>{children}</>;
}
