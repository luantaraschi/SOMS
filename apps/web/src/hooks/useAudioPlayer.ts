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
      const mediaError = audio.error;
      const code = mediaError?.code;
      // MediaError.code:
      //   1 = MEDIA_ERR_ABORTED (browser cancelou — normal em troca de src
      //       entre rounds, em Strict Mode dev, ou se o usuário pausou)
      //   2 = MEDIA_ERR_NETWORK (perdeu rede ou CDN deu 5xx)
      //   3 = MEDIA_ERR_DECODE (áudio corrompido)
      //   4 = MEDIA_ERR_SRC_NOT_SUPPORTED (URL inválida ou formato não suportado)
      //
      // Bug "algumas músicas não tocavam": antes setávamos 'error' em
      // QUALQUER código, incluindo ABORTED. Agora ignoramos ABORTED.
      if (code === 1) {
        return;
      }
      // Log estruturado pro diagnóstico de URLs específicas que falham.
      console.warn('[audio] error', {
        code,
        message: mediaError?.message,
        src: audio.src,
      });
      setState('error');
      if (code === 2) {
        setError('rede falhou pra carregar essa música.');
      } else if (code === 4) {
        setError('essa música não está disponível agora. aguarda o próximo round.');
      } else {
        setError('não consegui carregar o áudio dessa música.');
      }
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
      // AbortError vem quando play() é interrompido por pause() ou nova
      // chamada a load()/src=. Acontece naturalmente em React strict mode
      // dev (double-mount), em transição de round (novo src cancela o
      // anterior) e durante navegação. Não é erro real — só ruído. Bug D4.
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const isNotAllowed =
        err instanceof DOMException && err.name === 'NotAllowedError';
      setState(isNotAllowed ? 'blocked' : 'error');
      // err.message vem em inglês nativo do browser. Mostramos texto pt-BR
      // próprio. D-P6.
      setError(
        isNotAllowed
          ? 'clica pra tocar — o navegador pediu permissão.'
          : 'não consegui carregar o áudio dessa música. aguarda o próximo round.',
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
