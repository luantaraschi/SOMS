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

    function onGuessAccepted(_payload: GameGuessAcceptedEvent): void {
      // Privado pro autor. Por agora não usamos — feed público cobre UX
      // base. Toast de "+pts" é polimento (bloco D).
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
