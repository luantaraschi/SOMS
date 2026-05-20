'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AudioPlayerState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error'
  | 'blocked';

export type UseAudioPlayer = {
  state: AudioPlayerState;
  error: string | null;
  play: (url: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
};

/**
 * Abstração sobre HTML5 Audio. Lifecycle gerenciado pelo hook:
 * - Cria 1 instância no mount, destrói no unmount
 * - `play(url)` sobe a src + dispara `audio.play()`
 * - `stop()` pausa + zera position (não destrói)
 *
 * **Sobre autoplay**: navegadores bloqueiam `audio.play()` sem interação
 * prévia. No fluxo do C4, o host clicou "INICIAR PARTIDA" antes do play,
 * então 99% dos casos passam. Se falhar (Safari estrito), estado vai pra
 * `blocked` e a UI mostra fallback pra clicar e tocar.
 */
export function useAudioPlayer(): UseAudioPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = new Audio();
    audio.preload = 'auto';
    // Sem crossOrigin: previews do Deezer CDN não retornam
    // Access-Control-Allow-Origin. Setar 'anonymous' aqui exige esse header
    // e o browser aborta o stream ("fetching aborted"). Só precisaríamos de
    // CORS pra analisar o buffer via Web Audio API — não é o caso (waveform
    // é decorativa). (Bug D2.)
    audioRef.current = audio;

    const onLoadStart = (): void => setState('loading');
    const onCanPlay = (): void =>
      setState((s) => (s === 'loading' ? 'paused' : s));
    const onPlay = (): void => {
      setError(null);
      setState('playing');
    };
    const onPause = (): void =>
      setState((s) => (s === 'ended' || s === 'error' ? s : 'paused'));
    const onEnded = (): void => setState('ended');
    const onError = (): void => {
      setState('error');
      setError('não consegui carregar o áudio.');
    };

    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  const play = useCallback((url: string): void => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    audio.src = url;
    audio.currentTime = 0;
    audio.play().catch((err: unknown) => {
      const isNotAllowed =
        err instanceof DOMException && err.name === 'NotAllowedError';
      setState(isNotAllowed ? 'blocked' : 'error');
      setError(
        isNotAllowed
          ? 'clica pra tocar — o navegador pediu permissão.'
          : err instanceof Error
            ? err.message
            : 'erro ao reproduzir.',
      );
    });
  }, []);

  const stop = useCallback((): void => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setState('idle');
  }, []);

  const pause = useCallback((): void => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback((): void => {
    audioRef.current?.play().catch(() => undefined);
  }, []);

  return { state, error, play, stop, pause, resume };
}
