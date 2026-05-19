'use client';

import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { useIdentity } from '@/stores/identity';
import { useRoom } from '@/stores/room';
import { SmButton } from '@/components/primitives';

export function LeaveButton(): React.ReactElement {
  const router = useRouter();
  const userId = useIdentity((s) => s.userId);
  const nickname = useIdentity((s) => s.nickname);
  const clear = useRoom((s) => s.clear);

  function handleLeave(): void {
    if (!userId || !nickname) {
      clear();
      router.push('/');
      return;
    }
    const socket = getSocket({ userId, nickname });
    socket.emit('room:leave', () => {
      clear();
      router.push('/');
    });
  }

  return (
    <SmButton variant="ghost" onClick={handleLeave}>
      sair
    </SmButton>
  );
}
