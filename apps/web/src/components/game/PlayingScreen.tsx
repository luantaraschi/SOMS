'use client';

import { Send } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  SmBadge,
  SmButton,
  SmCard,
  SmInput,
} from '@/components/primitives';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { getSocket } from '@/lib/socket';
import { useGame } from '@/stores/game';
import { useIdentity } from '@/stores/identity';
import { GuessFeed } from './GuessFeed';
import { Timer } from './Timer';
import { Waveform } from './Waveform';

/**
 * Tela principal do round em curso. Coordena:
 *   - timer local (calcula segundos restantes via startedAt + durationMs)
 *   - áudio HTML5 (play assim que monta com previewUrl novo)
 *   - input de guess (emite game:guess; visual dimmed quando todos slots filled)
 *   - feed de respostas (todos veem todos, via game:guess:public)
 */
export function PlayingScreen(): React.ReactElement {
  const currentRound = useGame((s) => s.currentRound);
  const myOutcome = useGame((s) => s.myOutcomeForCurrentRound);
  const userId = useIdentity((s) => s.userId);
  const nickname = useIdentity((s) => s.nickname);
  const [answer, setAnswer] = useState('');
  const audio = useAudioPlayer();
  const { play: audioPlay, stop: audioStop } = audio;
  const lastPreviewUrlRef = useRef<string | null>(null);

  // Toca o preview assim que round muda. Compare por previewUrl pra evitar
  // re-trigger se o store ressetar e voltar com mesmo round.
  useEffect(() => {
    const url = currentRound?.previewUrl ?? null;
    if (url && url !== lastPreviewUrlRef.current) {
      lastPreviewUrlRef.current = url;
      audioPlay(url);
    }
    if (!url && lastPreviewUrlRef.current) {
      audioStop();
      lastPreviewUrlRef.current = null;
    }
  }, [currentRound?.previewUrl, audioPlay, audioStop]);

  // Detecta "acabou pra você" — todos os slots preenchidos.
  useEffect(() => {
    if (!currentRound) return;
    const allFilled = currentRound.slots.every((slot) =>
      currentRound.filledSlots.some((f) => f.kind === slot.kind),
    );
    if (allFilled) {
      useGame.getState().setMyOutcome('all_slots_taken');
    }
  }, [currentRound]);

  // Timer local (calcula via startedAt + durationMs)
  const [secondsLeft, setSecondsLeft] = useState(30);
  const totalSeconds = currentRound
    ? Math.floor(currentRound.durationMs / 1000)
    : 30;

  useEffect(() => {
    if (!currentRound) return;
    function update(): void {
      if (!currentRound) return;
      const remaining = Math.max(
        0,
        Math.ceil(
          (currentRound.startedAt + currentRound.durationMs - Date.now()) /
            1000,
        ),
      );
      setSecondsLeft(remaining);
    }
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [currentRound]);

  function sendGuess(): void {
    if (!answer.trim() || !userId || !nickname) return;
    const socket = getSocket({ userId, nickname });
    socket.emit('game:guess', { text: answer.trim() });
    setAnswer('');
  }

  function onAnswerChange(e: ChangeEvent<HTMLInputElement>): void {
    setAnswer(e.target.value);
  }

  if (!currentRound) {
    return (
      <main className="paper min-h-screen flex items-center justify-center p-8">
        <p className="t-label">aguardando round</p>
      </main>
    );
  }

  const isInputDimmed = myOutcome === 'all_slots_taken';
  const isAudioPlaying = audio.state === 'playing';

  return (
    <main
      className="paper min-h-screen p-6 flex flex-col gap-7"
      style={{ maxWidth: 880, margin: '0 auto' }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <SmBadge variant="special">
            round {currentRound.index + 1}/{currentRound.totalRounds}
          </SmBadge>
          <SmBadge>clássico turbinado</SmBadge>
        </div>
        <Timer secondsLeft={secondsLeft} total={totalSeconds} />
      </div>

      <Waveform playing={isAudioPlaying} />

      <SmCard
        className="p-4"
        style={{
          opacity: isInputDimmed ? 0.55 : 1,
          background: 'var(--surface)',
        }}
      >
        <div className="flex gap-3 items-stretch">
          <SmInput
            value={answer}
            onChange={onAnswerChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendGuess();
            }}
            placeholder={
              isInputDimmed
                ? 'acabou pra você — espera os outros'
                : 'acerte o som...'
            }
            style={{
              flex: 1,
              fontSize: 20,
              minHeight: 60,
              boxShadow: 'none',
            }}
          />
          <SmButton variant="primary" size="lg" onClick={sendGuess}>
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Send size={20} strokeWidth={2.8} /> enviar
            </span>
          </SmButton>
        </div>
        {isInputDimmed ? (
          <p
            className="t-caption italic mt-2"
            style={{ color: 'var(--ink-soft)' }}
          >
            todos os slots dessa música foram preenchidos
          </p>
        ) : null}
      </SmCard>

      <GuessFeed />

      {audio.state === 'blocked' ? (
        <SmCard
          className="p-4"
          style={{ background: 'var(--warm)' }}
        >
          <p className="t-label" style={{ marginBottom: 8 }}>
            áudio bloqueado
          </p>
          <p className="text-ink-soft" style={{ marginBottom: 12 }}>
            {audio.error ?? 'o navegador pediu permissão pra tocar.'}
          </p>
          <SmButton
            variant="primary"
            onClick={() => audio.play(currentRound.previewUrl)}
          >
            tocar áudio
          </SmButton>
        </SmCard>
      ) : null}

      {audio.state === 'error' && audio.error ? (
        <p
          className="t-caption italic"
          style={{ color: 'var(--danger)' }}
        >
          {audio.error}
        </p>
      ) : null}
    </main>
  );
}
