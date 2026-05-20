'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useIdentity } from '@/stores/identity';

/**
 * Banner discreto no topo das telas de sala/jogo. Reage ao estado do socket:
 *   - desconectado → banner amarelo "reconectando..." (persistente)
 *   - reconectado  → banner verde "online" (some em 2s)
 *   - sem conexão  → banner vermelho "sem conexão"
 *
 * Não renderiza nada em estado normal (conectado E nunca caiu na vida).
 * Não usa o useRoom store porque queremos reagir direto do socket — mais
 * imediato e funciona mesmo fora da rota de sala.
 */
type Status = 'idle' | 'reconnecting' | 'online' | 'error';

const ONLINE_FLASH_MS = 2_000;

export function ConnectionToast(): React.ReactElement | null {
  const userId = useIdentity((s) => s.userId);
  const nickname = useIdentity((s) => s.nickname);
  const [status, setStatus] = useState<Status>('idle');
  const wasDisconnectedRef = useRef(false);
  const onlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId || !nickname) return;
    const socket = getSocket({ userId, nickname });

    function clearOnlineTimer(): void {
      if (onlineTimerRef.current) {
        clearTimeout(onlineTimerRef.current);
        onlineTimerRef.current = null;
      }
    }

    function onConnect(): void {
      if (wasDisconnectedRef.current) {
        setStatus('online');
        clearOnlineTimer();
        onlineTimerRef.current = setTimeout(() => {
          setStatus('idle');
        }, ONLINE_FLASH_MS);
        wasDisconnectedRef.current = false;
      } else {
        setStatus('idle');
      }
    }

    function onDisconnect(): void {
      wasDisconnectedRef.current = true;
      setStatus('reconnecting');
      clearOnlineTimer();
    }

    function onConnectError(): void {
      wasDisconnectedRef.current = true;
      setStatus('error');
      clearOnlineTimer();
    }

    // Estado inicial baseado no socket atual
    if (socket.connected) {
      setStatus('idle');
    } else if (wasDisconnectedRef.current) {
      setStatus('reconnecting');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      clearOnlineTimer();
    };
  }, [userId, nickname]);

  if (status === 'idle') return null;

  const bg =
    status === 'online'
      ? 'var(--success)'
      : status === 'reconnecting'
        ? 'var(--warm)'
        : 'var(--danger)';
  const color = status === 'error' ? '#fff' : 'var(--ink)';
  const label =
    status === 'online'
      ? 'online'
      : status === 'reconnecting'
        ? 'reconectando...'
        : 'sem conexão';

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        background: bg,
        color,
        border: '3px solid var(--ink)',
        borderRadius: 12,
        boxShadow: '4px 4px 0 0 var(--shadow-color)',
        padding: '8px 16px',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 13,
        textTransform: 'lowercase',
        letterSpacing: '0.04em',
        zIndex: 999,
        pointerEvents: 'none',
      }}
    >
      {label}
    </div>
  );
}
