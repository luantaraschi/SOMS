import type {
  CurrentRoundSnapshot,
  GameStateSnapshot,
  LastRevealSnapshot,
  PlayerSnapshot,
  RoomSnapshot,
  SlotFillPublic,
} from '@soms/shared';
import type { GameSession, RoundInProgress } from '../game/session-store.js';
import type { Player, Room } from '../rooms/types.js';

export function toPlayerSnapshot(player: Player): PlayerSnapshot {
  return {
    userId: player.userId,
    nickname: player.nickname,
    joinedAt: player.joinedAt,
    isHost: player.isHost,
    isConnected: player.isConnected,
  };
}

export function buildRoomSnapshot(
  room: Room,
  yourUserId: string,
  gameSession?: GameSession | null,
): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostUserId: room.hostUserId,
    players: Array.from(room.players.values()).map(toPlayerSnapshot),
    settings: room.settings,
    yourUserId,
  };

  if (
    gameSession &&
    (room.status === 'countdown' ||
      room.status === 'playing' ||
      room.status === 'reveal')
  ) {
    snapshot.gameState = buildGameStateSnapshot(room, gameSession);
  }

  return snapshot;
}

function buildGameStateSnapshot(
  room: Room,
  session: GameSession,
): GameStateSnapshot {
  const state: GameStateSnapshot = {
    currentRoundIndex: session.completedRounds.length,
    totalRounds: session.queue.length,
    scores: Array.from(session.scores.values()).map((s) => ({
      userId: s.userId,
      totalPoints: s.totalPoints,
      roundPoints: [...s.roundPoints],
    })),
  };

  if (session.currentRound && room.status === 'playing') {
    state.currentRound = buildCurrentRoundSnapshot(room, session.currentRound, session.queue.length);
  }

  if (room.status === 'reveal' && session.completedRounds.length > 0) {
    const last = session.completedRounds[session.completedRounds.length - 1];
    if (last !== undefined) {
      state.lastReveal = buildLastRevealSnapshot(room, last);
    }
  }

  return state;
}

function buildCurrentRoundSnapshot(
  room: Room,
  round: RoundInProgress,
  totalRounds: number,
): CurrentRoundSnapshot {
  return {
    index: round.index,
    totalRounds,
    startedAt: round.startedAt,
    durationMs: round.durationMs,
    previewUrl: round.queueItem.freshPreviewUrl,
    slots: round.slots.map((s) => ({ kind: s.kind, basePoints: s.basePoints })),
    fills: round.fills.map((f) => publicFill(room, round, f.slotKind, f.winners)),
    decade: round.queueItem.decade,
  };
}

function buildLastRevealSnapshot(
  room: Room,
  round: RoundInProgress,
): LastRevealSnapshot {
  return {
    roundIndex: round.index,
    track: {
      title: round.queueItem.title,
      artists: round.queueItem.artists,
      album: null,
      coverUrl: round.queueItem.coverUrl || null,
      releaseYear: null,
    },
    fills: round.fills.map((f) => publicFill(room, round, f.slotKind, f.winners)),
  };
}

function publicFill(
  room: Room,
  round: RoundInProgress,
  slotKind: 'title' | 'artist' | 'feat',
  winners: { userId: string; tIntoRoundMs: number; pointsAwarded: number }[],
): SlotFillPublic {
  const slot = round.slots.find((s) => s.kind === slotKind);
  return {
    kind: slotKind,
    display: slot?.display ?? '',
    winners: winners.map((w) => ({
      userId: w.userId,
      nickname: room.players.get(w.userId)?.nickname ?? '',
      pointsAwarded: w.pointsAwarded,
      tIntoRoundMs: w.tIntoRoundMs,
    })),
  };
}
