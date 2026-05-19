'use client';

import type { PlayerSnapshot } from '@soms/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { SmAvatar, SmBadge, SmCard } from '@/components/primitives';

type PlayerListProps = {
  players: PlayerSnapshot[];
  hostUserId: string;
  currentUserId: string;
};

export function PlayerList({
  players,
  hostUserId,
  currentUserId,
}: PlayerListProps): React.ReactElement {
  return (
    <SmCard>
      <p className="t-h3 mb-4">JOGADORES ({players.length})</p>
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {players.map((player, index) => {
            const isHost = player.userId === hostUserId;
            const isMe = player.userId === currentUserId;
            return (
              <motion.div
                key={player.userId}
                initial={{ scale: 0, opacity: 0, rotate: -8 }}
                animate={{
                  scale: 1,
                  opacity: player.isConnected ? 1 : 0.55,
                  rotate: index % 2 === 0 ? -1.5 : 1.5,
                }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                className="sm-card !p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <SmAvatar
                      initial={player.nickname}
                      bgColor={isHost ? 'var(--special)' : 'var(--primary)'}
                      textColor={isHost ? '#fff' : 'var(--ink)'}
                    />
                    <div className="min-w-0">
                      <p className="t-h3 truncate">{player.nickname}</p>
                      {!player.isConnected ? (
                        <p className="t-caption italic" style={{ color: 'var(--danger)' }}>
                          desconectado
                        </p>
                      ) : isMe ? (
                        <p className="t-caption" style={{ color: 'var(--ink-soft)' }}>
                          você
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {isHost ? <SmBadge variant="host">host</SmBadge> : null}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </SmCard>
  );
}
