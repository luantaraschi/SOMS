'use client';

import {
  DEFAULT_TOTAL_ROUNDS,
  MAX_NICKNAME_LENGTH,
  ROOM_CODE_LENGTH,
  ROUND_DURATION_MS,
  nicknameErrorMessage,
  roomCodeErrorMessage,
  validateNickname,
  validateRoomCode,
  type RoomCreateAck,
  type RoomJoinAck,
} from '@soms/shared';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ChangeEvent } from 'react';
import {
  SmButton,
  SmCard,
  SmInput,
  SmLabel,
} from '@/components/primitives';
import { getSocket } from '@/lib/socket';
import { useIdentity } from '@/stores/identity';

type Submitting = 'create' | 'join' | null;

export default function HomePage(): React.ReactElement {
  const router = useRouter();
  const savedNickname = useIdentity((s) => s.nickname);
  const userId = useIdentity((s) => s.userId);
  const setIdentity = useIdentity((s) => s.setIdentity);

  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Submitting>(null);

  // Sync com store após hidratação do persist middleware (1ª pintura é null).
  useEffect(() => {
    if (savedNickname && nickname === '') setNickname(savedNickname);
  }, [savedNickname, nickname]);

  function onNicknameChange(e: ChangeEvent<HTMLInputElement>): void {
    setNickname(e.target.value);
    if (nicknameError) setNicknameError(null);
  }

  function onCodeChange(e: ChangeEvent<HTMLInputElement>): void {
    setCode(e.target.value.toUpperCase());
    if (codeError) setCodeError(null);
  }

  /**
   * Valida nickname, garante userId, conecta socket. Retorna credenciais
   * prontas pra usar nos handlers. null = validação falhou (mensagem já setada).
   */
  async function prepareAndConnect(): Promise<
    | { userId: string; nickname: string }
    | null
  > {
    const result = validateNickname(nickname);
    if (!result.ok) {
      setNicknameError(nicknameErrorMessage(result.reason));
      return null;
    }
    setNicknameError(null);

    // Atualiza store. setIdentity gera userId se ainda não existe + grava nickname.
    setIdentity(result.normalized);
    const id = useIdentity.getState().userId;
    if (!id) {
      // Falha extrema (crypto.randomUUID ausente?). Mostra erro genérico.
      setNicknameError('algo deu errado. recarrega a página.');
      return null;
    }

    const socket = getSocket({ userId: id, nickname: result.normalized });
    if (!socket.connected) {
      try {
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error('timeout')), 5_000);
          socket.once('connect', () => {
            clearTimeout(t);
            resolve();
          });
          socket.once('connect_error', (err) => {
            clearTimeout(t);
            reject(err);
          });
          socket.connect();
        });
      } catch {
        setNicknameError('não consegui conectar. tenta de novo.');
        return null;
      }
    }
    return { userId: id, nickname: result.normalized };
  }

  async function handleCreate(): Promise<void> {
    setSubmitting('create');
    const creds = await prepareAndConnect();
    if (!creds) {
      setSubmitting(null);
      return;
    }
    const socket = getSocket(creds);
    socket.emit(
      'room:create',
      {
        settings: {
          totalRounds: DEFAULT_TOTAL_ROUNDS,
          roundDurationSeconds: Math.floor(ROUND_DURATION_MS / 1000),
          trackSource: { type: 'genre_decade', genres: [], decades: [] },
        },
      },
      (ack: RoomCreateAck) => {
        if (ack.ok) {
          router.push(`/sala/${ack.code}`);
        } else {
          setNicknameError(ack.error.message);
          setSubmitting(null);
        }
      },
    );
  }

  async function handleJoin(): Promise<void> {
    setSubmitting('join');
    const codeResult = validateRoomCode(code);
    if (!codeResult.ok) {
      setCodeError(roomCodeErrorMessage(codeResult.reason));
      setSubmitting(null);
      return;
    }
    setCodeError(null);

    const creds = await prepareAndConnect();
    if (!creds) {
      setSubmitting(null);
      return;
    }
    const socket = getSocket(creds);
    socket.emit(
      'room:join',
      { code: codeResult.normalized },
      (ack: RoomJoinAck) => {
        if (ack.ok) {
          router.push(`/sala/${codeResult.normalized}`);
        } else {
          // Erros relacionados a nickname → mostra no campo nickname
          if (
            ack.error.code === 'NICKNAME_TAKEN' ||
            ack.error.code === 'NICKNAME_INVALID'
          ) {
            setNicknameError(ack.error.message);
          } else {
            setCodeError(ack.error.message);
          }
          setSubmitting(null);
        }
      },
    );
  }

  const isSubmitting = submitting !== null;

  return (
    <main className="paper flex flex-col items-center justify-center p-8 gap-12">
      <div className="text-center">
        <h1 className="t-mega">SOMS</h1>
        <p className="t-slogan mt-2">todo mundo acha que sabe.</p>
      </div>

      <SmCard tilt="l" className="w-full" style={{ maxWidth: '440px' }}>
        <div className="flex flex-col gap-6">
          <div>
            <SmLabel htmlFor="nickname">qual seu apelido?</SmLabel>
            <SmInput
              id="nickname"
              value={nickname}
              onChange={onNicknameChange}
              placeholder="memi"
              disabled={isSubmitting}
              autoFocus
              maxLength={MAX_NICKNAME_LENGTH}
            />
            {nicknameError ? (
              <p
                className="mt-2 italic"
                style={{
                  color: 'var(--danger)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {nicknameError}
              </p>
            ) : null}
          </div>

          <SmButton
            variant="primary"
            size="lg"
            block
            onClick={handleCreate}
            disabled={isSubmitting}
          >
            {submitting === 'create' ? 'CRIANDO...' : 'CRIAR SALA'}
          </SmButton>

          <div className="t-label text-center" style={{ color: 'var(--ink-soft)' }}>
            ou entra com código
          </div>

          <div>
            <SmInput
              id="code"
              mono
              value={code}
              onChange={onCodeChange}
              placeholder="ABKM"
              disabled={isSubmitting}
              maxLength={ROOM_CODE_LENGTH}
            />
            {codeError ? (
              <p
                className="mt-2 italic"
                style={{
                  color: 'var(--danger)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {codeError}
              </p>
            ) : null}
          </div>

          <SmButton
            variant="secondary"
            size="lg"
            block
            onClick={handleJoin}
            disabled={isSubmitting || code.trim().length === 0}
          >
            {submitting === 'join' ? 'ENTRANDO...' : 'ENTRAR'}
          </SmButton>
        </div>
      </SmCard>

      <p className="t-caption">feito pra ouvir com amigos.</p>
    </main>
  );
}
