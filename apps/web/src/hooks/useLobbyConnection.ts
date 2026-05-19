'use client';

import type {
  RoomJoinAck,
  RoomSettings,
  RoomSnapshot,
  ServerErrorCode,
} from '@soms/shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useIdentity } from '@/stores/identity';
import { useRoom } from '@/stores/room';

export function useLobbyConnection(code: string): void {
  const router = useRouter();
  const userId = useIdentity((s) => s.userId);
  const nickname = useIdentity((s) => s.nickname);
  const setSnapshot = useRoom((s) => s.setSnapshot);
  const setConnectionStatus = useRoom((s) => s.setConnectionStatus);
  const upsertPlayer = useRoom((s) => s.upsertPlayer);
  const removePlayer = useRoom((s) => s.removePlayer);
  const markPlayerDisconnected = useRoom((s) => s.markPlayerDisconnected);
  const markPlayerReconnected = useRoom((s) => s.markPlayerReconnected);
  const changeHost = useRoom((s) => s.changeHost);
  const updateStatus = useRoom((s) => s.updateStatus);
  const updateSettings = useRoom((s) => s.updateSettings);
  const clear = useRoom((s) => s.clear);

  useEffect(() => {
    if (!nickname || !userId) {
      router.replace(`/?code=${code}`);
      return;
    }

    setConnectionStatus('connecting');
    const socket = getSocket({ userId, nickname });
    socket.auth = { userId, nickname };

    let joinTimeoutId: ReturnType<typeof setTimeout> | null = null;

    function clearJoinTimeout(): void {
      if (joinTimeoutId) {
        clearTimeout(joinTimeoutId);
        joinTimeoutId = null;
      }
    }

    function joinRoomIfNeeded(): void {
      socket.emit('room:join', { code }, (ack: RoomJoinAck) => {
        if (!ack.ok) {
          router.replace(buildErrorRedirect(ack.error.code, code));
          return;
        }
        setSnapshot(ack.snapshot);
      });
    }

    function onConnect(): void {
      setConnectionStatus('connected');
      // Em reconexão o server costuma mandar room:snapshot sozinho.
      joinTimeoutId = setTimeout(() => {
        const currentSnapshot = useRoom.getState().snapshot;
        if (!currentSnapshot || currentSnapshot.code !== code) {
          joinRoomIfNeeded();
        }
      }, 500);
    }

    function onRoomSnapshot(snapshot: RoomSnapshot): void {
      clearJoinTimeout();
      if (snapshot.code !== code) return;
      setSnapshot(snapshot);
    }

    function onRoomSettingsUpdated(payload: { settings: RoomSettings }): void {
      updateSettings(payload.settings);
    }

    socket.on('connect', onConnect);
    socket.on('room:snapshot', onRoomSnapshot);
    socket.on('room:player:joined', ({ player }) => upsertPlayer(player));
    socket.on('room:player:left', ({ userId: leftId }) => removePlayer(leftId));
    socket.on('room:player:disconnected', ({ userId: disconnectedId }) =>
      markPlayerDisconnected(disconnectedId),
    );
    socket.on('room:player:reconnected', ({ userId: reconnectedId }) =>
      markPlayerReconnected(reconnectedId),
    );
    socket.on('room:host:changed', ({ newHostUserId }) => changeHost(newHostUserId));
    socket.on('room:status:changed', ({ to }) => updateStatus(to));
    socket.on('room:settings:updated', onRoomSettingsUpdated);
    socket.on('room:destroyed', () => {
      router.replace('/?error=ROOM_DESTROYED');
    });
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('connect_error', () => setConnectionStatus('error'));
    socket.on('error', (err) => {
      console.warn('[lobby] server error:', err);
    });

    if (!socket.connected) {
      socket.connect();
    } else {
      onConnect();
    }

    return () => {
      clearJoinTimeout();
      socket.off('connect', onConnect);
      socket.off('room:snapshot', onRoomSnapshot);
      socket.off('room:player:joined');
      socket.off('room:player:left');
      socket.off('room:player:disconnected');
      socket.off('room:player:reconnected');
      socket.off('room:host:changed');
      socket.off('room:status:changed');
      socket.off('room:settings:updated', onRoomSettingsUpdated);
      socket.off('room:destroyed');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('error');
    };
  }, [
    code,
    userId,
    nickname,
    router,
    setSnapshot,
    setConnectionStatus,
    upsertPlayer,
    removePlayer,
    markPlayerDisconnected,
    markPlayerReconnected,
    changeHost,
    updateStatus,
    updateSettings,
  ]);

  useEffect(() => () => clear(), [clear]);
}

function buildErrorRedirect(errorCode: ServerErrorCode, code: string): string {
  switch (errorCode) {
    case 'ROOM_NOT_FOUND':
      return '/?error=ROOM_NOT_FOUND';
    case 'ROOM_IN_PROGRESS':
      return '/?error=ROOM_IN_PROGRESS';
    case 'ROOM_FULL':
      return '/?error=ROOM_FULL';
    case 'NICKNAME_TAKEN':
      return `/?error=NICKNAME_TAKEN&code=${code}`;
    default:
      return `/?error=${errorCode}&code=${code}`;
  }
}
