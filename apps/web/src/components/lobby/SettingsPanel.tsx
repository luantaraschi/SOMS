'use client';

import {
  DECADES,
  GENRES,
  MAX_TOTAL_ROUNDS,
  MIN_TOTAL_ROUNDS,
  type RoomSettings,
} from '@soms/shared';
import { useEffect, useMemo, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useIdentity } from '@/stores/identity';
import { SmCard, SmInput } from '@/components/primitives';

type SettingsPanelProps = {
  settings: RoomSettings;
  canEdit: boolean;
};

type EditableSettings = {
  totalRounds: number;
  genres: string[];
  decades: number[];
};

export function SettingsPanel({
  settings,
  canEdit,
}: SettingsPanelProps): React.ReactElement {
  const userId = useIdentity((s) => s.userId);
  const nickname = useIdentity((s) => s.nickname);
  const [local, setLocal] = useState<EditableSettings>(() => toEditable(settings));
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    setLocal(toEditable(settings));
  }, [settings]);

  useEffect(() => {
    if (!canEdit || !userId || !nickname) return;

    const timer = setTimeout(() => {
      const socket = getSocket({ userId, nickname });
      socket.emit(
        'room:settings:update',
        {
          settings: {
            totalRounds: local.totalRounds,
            trackSource: {
              type: 'genre_decade',
              genres: local.genres,
              decades: local.decades,
            },
          },
        },
        (ack) => {
          if (!ack.ok) {
            setSyncError(ack.error?.message ?? 'não consegui salvar as configurações.');
          } else {
            setSyncError(null);
          }
        },
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [local, canEdit, userId, nickname]);

  const decadesLabel = useMemo(
    () => (settings.trackSource.decades.length > 0 ? settings.trackSource.decades.join(', ') : 'nenhuma'),
    [settings.trackSource.decades],
  );
  const genresLabel = useMemo(
    () =>
      settings.trackSource.genres.length > 0
        ? settings.trackSource.genres
            .map((genre) => GENRES[genre as keyof typeof GENRES]?.label ?? genre)
            .join(', ')
        : 'nenhum',
    [settings.trackSource.genres],
  );

  function toggleGenre(genre: string): void {
    setLocal((prev) => {
      const has = prev.genres.includes(genre);
      if (has && prev.genres.length === 1) return prev;
      return {
        ...prev,
        genres: has ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre],
      };
    });
  }

  function toggleDecade(decade: number): void {
    setLocal((prev) => {
      const has = prev.decades.includes(decade);
      if (has && prev.decades.length === 1) return prev;
      return {
        ...prev,
        decades: has ? prev.decades.filter((d) => d !== decade) : [...prev.decades, decade],
      };
    });
  }

  return (
    <SmCard>
      <p className="t-h3 mb-4">CONFIGURAÇÕES</p>
      {canEdit ? (
        <div className="flex flex-col gap-5">
          <div>
            <p className="t-label mb-2">rounds</p>
            <SmInput
              type="number"
              value={String(local.totalRounds)}
              onChange={(e) =>
                setLocal((prev) => ({
                  ...prev,
                  totalRounds: clampRounds(Number(e.target.value)),
                }))
              }
              min={MIN_TOTAL_ROUNDS}
              max={MAX_TOTAL_ROUNDS}
            />
          </div>

          <div>
            <p className="t-label mb-2">gêneros</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(GENRES).map(([genreKey, genre]) => {
                const active = local.genres.includes(genreKey);
                return (
                  <ChipButton
                    key={genreKey}
                    active={active}
                    onClick={() => toggleGenre(genreKey)}
                  >
                    {genre.label}
                  </ChipButton>
                );
              })}
            </div>
          </div>

          <div>
            <p className="t-label mb-2">décadas</p>
            <div className="flex flex-wrap gap-2">
              {DECADES.map((decade) => {
                const active = local.decades.includes(decade);
                return (
                  <ChipButton
                    key={decade}
                    active={active}
                    onClick={() => toggleDecade(decade)}
                  >
                    {decade}
                  </ChipButton>
                );
              })}
            </div>
          </div>

          {syncError ? (
            <p className="t-caption italic" style={{ color: 'var(--danger)' }}>
              {syncError}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="t-body">
            rounds: <span className="t-mono">{settings.totalRounds}</span>
          </p>
          <p className="t-body">gêneros: {genresLabel}</p>
          <p className="t-body">décadas: {decadesLabel}</p>
          <p className="t-caption italic mt-2" style={{ color: 'var(--ink-soft)' }}>
            apenas o host pode alterar
          </p>
        </div>
      )}
    </SmCard>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 border-3 rounded-[999px] t-label"
      style={
        active
          ? {
              borderColor: 'var(--ink)',
              background: 'var(--primary)',
              color: 'var(--ink)',
              boxShadow: 'var(--shadow-sm)',
            }
          : {
              borderColor: 'var(--ink)',
              background: 'var(--surface)',
              color: 'var(--ink)',
            }
      }
    >
      {children}
    </button>
  );
}

function toEditable(settings: RoomSettings): EditableSettings {
  return {
    totalRounds: settings.totalRounds,
    genres: [...settings.trackSource.genres],
    decades: [...settings.trackSource.decades],
  };
}

function clampRounds(value: number): number {
  if (!Number.isFinite(value)) return MIN_TOTAL_ROUNDS;
  return Math.max(MIN_TOTAL_ROUNDS, Math.min(MAX_TOTAL_ROUNDS, Math.trunc(value)));
}
