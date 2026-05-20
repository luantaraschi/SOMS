'use client';

import type {
  GameCountdownEvent,
  GameEndedEvent,
  GameGuessAcceptedEvent,
  GameGuessPublicEvent,
  GamePreparingEvent,
  GameRoundRevealEvent,
  GameRoundStartedEvent,
  GameSlotFilledEvent,
} from '@soms/shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/stores/game';
import { useIdentity } from '@/stores/identity';
import { useRoom } from '@/stores/room';
import { useToast } from '@/stores/toast';

/**
 * Registra listeners de eventos de jogo (game:*). Complementar ao
 * useLobbyConnection (room:*). Ambos devem estar montados na rota /jogar.
 *
 * Não emite room:join — useLobbyConnection já cuida disso. Quando o snapshot
 * tem gameState (reconexão mid-game), hidrata a store via hydrateFromSnapshot.
 */
export function useGameConnection(code: string): void {
  const router = useRouter();
  const userId = useIdentity((s) => s.userId);
  const nickname = useIdentity((s) => s.nickname);

  useEffect(() => {
    if (!userId || !nickname) {
      router.replace(`/?code=${code}`);
      return;
    }

    const socket = getSocket({ userId, nickname });
    const game = useGame.getState();

    function onPreparing(_payload: GamePreparingEvent): void {
      useGame.getState().setPreparing();
    }

    function onCountdown(payload: GameCountdownEvent): void {
      useGame.getState().setCountdown(payload.startsAt);
    }

    function onRoundStarted(payload: GameRoundStartedEvent): void {
      useGame.getState().startRound(payload);
    }

    function onSlotFilled(payload: GameSlotFilledEvent): void {
      useGame.getState().addSlotFill(payload);
    }

    function onGuessPublic(payload: GameGuessPublicEvent): void {
      useGame.getState().addFeedEntry(payload);
    }

    function onGuessAccepted(payload: GameGuessAcceptedEvent): void {
      const { outcome } = payload;
      const toast = useToast.getState();
      switch (outcome.kind) {
        case 'hit': {
          const tieSuffix = outcome.isTie ? ' (empate)' : '';
          toast.show({
            text: `acertou +${outcome.points} pts${tieSuffix}`,
            variant: 'success',
          });
          break;
        }
        case 'too_late':
          toast.show({ text: 'tarde demais', variant: 'warm', ttlMs: 1_500 });
          break;
        case 'rate_limited':
          toast.show({ text: 'calma — espera um pouco', variant: 'info', ttlMs: 1_200 });
          break;
        // 'miss' não dispara toast — já aparece no feed.
      }
    }

    function onRoundReveal(payload: GameRoundRevealEvent): void {
      const g = useGame.getState();
      g.setReveal(payload);
      for (const score of payload.scoresSnapshot) {
        g.updateScore(score.userId, score.totalPoints);
      }
    }

    function onGameEnded(payload: GameEndedEvent): void {
      const g = useGame.getState();
      g.setEnded(payload);
      for (const r of payload.ranking) {
        g.updateScore(r.userId, r.totalPoints);
      }
    }

    socket.on('game:preparing', onPreparing);
    socket.on('game:countdown', onCountdown);
    socket.on('game:round:started', onRoundStarted);
    socket.on('game:slot:filled', onSlotFilled);
    socket.on('game:guess:public', onGuessPublic);
    socket.on('game:guess:accepted', onGuessAccepted);
    socket.on('game:round:reveal', onRoundReveal);
    socket.on('game:ended', onGameEnded);

    // Se já temos um snapshot no store com gameState (reconexão), hidrata.
    const snapshot = useRoom.getState().snapshot;
    if (snapshot?.gameState) {
      game.hydrateFromSnapshot(snapshot.gameState);
    }

    return () => {
      socket.off('game:preparing', onPreparing);
      socket.off('game:countdown', onCountdown);
      socket.off('game:round:started', onRoundStarted);
      socket.off('game:slot:filled', onSlotFilled);
      socket.off('game:guess:public', onGuessPublic);
      socket.off('game:guess:accepted', onGuessAccepted);
      socket.off('game:round:reveal', onRoundReveal);
      socket.off('game:ended', onGameEnded);
    };
  }, [code, userId, nickname, router]);
}
