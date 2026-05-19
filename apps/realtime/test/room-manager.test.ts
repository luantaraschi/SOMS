import type { RoomSettings } from '@soms/shared';
import { pino } from 'pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomManager } from '../src/rooms/room-manager.js';
import type {
  Player,
  Room,
  RoomManagerEvents,
  RoomStatus,
} from '../src/rooms/types.js';

const silentLogger = pino({ level: 'silent' });

const defaultSettings: RoomSettings = {
  totalRounds: 10,
  roundDurationSeconds: 30,
  trackSource: { type: 'genre_decade', genres: ['pop'], decades: [2010] },
};

type EventSpies = {
  [K in keyof RoomManagerEvents]: ReturnType<typeof vi.fn>;
};

function setup(): { manager: RoomManager; events: EventSpies } {
  const events: EventSpies = {
    onRoomCreated: vi.fn(),
    onPlayerJoined: vi.fn(),
    onPlayerLeft: vi.fn(),
    onHostChanged: vi.fn(),
    onStatusChanged: vi.fn(),
    onPlayerReconnected: vi.fn(),
    onPlayerDisconnected: vi.fn(),
    onRoomAbandoned: vi.fn(),
    onRoomDestroyed: vi.fn(),
  };
  const manager = new RoomManager({ logger: silentLogger, events });
  return { manager, events };
}

function createRoom(
  manager: RoomManager,
  hostUserId = 'host-1',
  hostNickname = 'Host',
): Room {
  const r = manager.createRoom({ hostUserId, hostNickname, settings: defaultSettings });
  if (!r.ok) throw new Error('createRoom failed');
  return r.room;
}

function joinAs(
  manager: RoomManager,
  code: string,
  userId: string,
  nickname: string,
): Player {
  const r = manager.joinRoom({ code, userId, nickname });
  if (!r.ok) throw new Error(`joinRoom failed: ${r.error.code}`);
  return r.player;
}

function forceStatus(room: Room, status: RoomStatus): void {
  room.status = status;
}

describe('RoomManager.createRoom', () => {
  it('cria sala válida em lobby com 1 player que é o host', () => {
    const { manager } = setup();
    const r = manager.createRoom({
      hostUserId: 'u1',
      hostNickname: 'Lua',
      settings: defaultSettings,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.room.status).toBe('lobby');
    expect(r.room.hostUserId).toBe('u1');
    expect(r.room.players.size).toBe(1);
    const host = r.room.players.get('u1');
    expect(host?.isHost).toBe(true);
    expect(host?.isConnected).toBe(true);
    expect(host?.nickname).toBe('Lua');
  });

  it('100 createRoom geram códigos únicos válidos', () => {
    const { manager } = setup();
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const r = manager.createRoom({
        hostUserId: `u${i}`,
        hostNickname: `Player${i}`,
        settings: defaultSettings,
      });
      if (!r.ok) throw new Error('createRoom failed');
      expect(r.room.code).toMatch(/^[A-HJ-NP-Z]{4}$/);
      codes.add(r.room.code);
    }
    expect(codes.size).toBe(100);
  });

  it('settings são preservadas exatamente (referência)', () => {
    const { manager } = setup();
    const settings: RoomSettings = {
      totalRounds: 5,
      roundDurationSeconds: 20,
      trackSource: { type: 'genre_decade', genres: ['rock', 'pop'], decades: [1990, 2000] },
    };
    const r = manager.createRoom({ hostUserId: 'u1', hostNickname: 'a1', settings });
    if (!r.ok) throw new Error();
    expect(r.room.settings).toEqual(settings);
  });

  it('rejeita nickname inválido com NICKNAME_INVALID', () => {
    const { manager } = setup();
    const r = manager.createRoom({
      hostUserId: 'u1',
      hostNickname: ' ',
      settings: defaultSettings,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NICKNAME_INVALID');
  });

  it('dispara onRoomCreated com a sala', () => {
    const { manager, events } = setup();
    const r = manager.createRoom({
      hostUserId: 'u1',
      hostNickname: 'a1',
      settings: defaultSettings,
    });
    if (!r.ok) throw new Error();
    expect(events.onRoomCreated).toHaveBeenCalledOnce();
    expect(events.onRoomCreated).toHaveBeenCalledWith(r.room);
  });
});

describe('RoomManager.joinRoom', () => {
  let manager: RoomManager;
  let events: EventSpies;
  let room: Room;

  beforeEach(() => {
    const s = setup();
    manager = s.manager;
    events = s.events;
    room = createRoom(manager);
  });

  it('player válido entra na sala em lobby', () => {
    const r = manager.joinRoom({ code: room.code, userId: 'u2', nickname: 'Bob' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(room.players.size).toBe(2);
    expect(r.player.isHost).toBe(false);
    expect(r.player.isConnected).toBe(true);
    expect(events.onPlayerJoined).toHaveBeenCalledOnce();
  });

  it('nickname duplicado (case-insensitive, trimmed) → NICKNAME_TAKEN', () => {
    manager.joinRoom({ code: room.code, userId: 'u2', nickname: 'Bob' });
    const r = manager.joinRoom({ code: room.code, userId: 'u3', nickname: '  BOB  ' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NICKNAME_TAKEN');
  });

  it('nickname vazio → NICKNAME_INVALID', () => {
    const r = manager.joinRoom({ code: room.code, userId: 'u2', nickname: '' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NICKNAME_INVALID');
  });

  it('nickname com >20 caracteres → NICKNAME_INVALID', () => {
    const r = manager.joinRoom({
      code: room.code,
      userId: 'u2',
      nickname: 'a'.repeat(21),
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NICKNAME_INVALID');
  });

  it('nickname com chars de controle → NICKNAME_INVALID', () => {
    const r = manager.joinRoom({
      code: room.code,
      userId: 'u2',
      nickname: `Bob${String.fromCharCode(0)}`,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NICKNAME_INVALID');
  });

  it('join em sala em playing → ROOM_IN_PROGRESS', () => {
    forceStatus(room, 'playing');
    const r = manager.joinRoom({ code: room.code, userId: 'u2', nickname: 'Bob' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('ROOM_IN_PROGRESS');
  });

  it('join em sala em ended → ROOM_ENDED', () => {
    forceStatus(room, 'ended');
    const r = manager.joinRoom({ code: room.code, userId: 'u2', nickname: 'Bob' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('ROOM_ENDED');
  });

  it('join em sala inexistente → ROOM_NOT_FOUND', () => {
    const r = manager.joinRoom({ code: 'XXXX', userId: 'u2', nickname: 'Bob' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('ROOM_NOT_FOUND');
  });

  it('join em sala lotada (MAX_PLAYERS=20) → ROOM_FULL', () => {
    for (let i = 2; i <= 20; i++) {
      const r = manager.joinRoom({
        code: room.code,
        userId: `u${i}`,
        nickname: `P${i}`,
      });
      if (!r.ok) throw new Error(`unexpected fail at i=${i}: ${r.error.code}`);
    }
    expect(room.players.size).toBe(20);
    const r = manager.joinRoom({ code: room.code, userId: 'u21', nickname: 'P21' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('ROOM_FULL');
    if (r.error.code === 'ROOM_FULL') {
      expect(r.error.max).toBe(20);
    }
  });

  it('mesmo userId tenta join 2x → PLAYER_ALREADY_IN_ROOM', () => {
    manager.joinRoom({ code: room.code, userId: 'u2', nickname: 'Bob' });
    const r = manager.joinRoom({ code: room.code, userId: 'u2', nickname: 'Bobby' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('PLAYER_ALREADY_IN_ROOM');
  });
});

describe('RoomManager.leaveRoom', () => {
  let manager: RoomManager;
  let events: EventSpies;
  let room: Room;

  beforeEach(() => {
    const s = setup();
    manager = s.manager;
    events = s.events;
    room = createRoom(manager, 'host', 'Host');
    joinAs(manager, room.code, 'mem1', 'Mem1');
    joinAs(manager, room.code, 'mem2', 'Mem2');
  });

  it('member sai, players decrementa, host inalterado', () => {
    const r = manager.leaveRoom(room.code, 'mem1');
    expect(r.ok).toBe(true);
    expect(room.players.size).toBe(2);
    expect(room.hostUserId).toBe('host');
    expect(events.onPlayerLeft).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'leave',
    );
  });

  it('host sai com outros → fallback para próximo por joinedAt', () => {
    const r = manager.leaveRoom(room.code, 'host');
    expect(r.ok).toBe(true);
    expect(room.hostUserId).toBe('mem1');
    expect(room.players.get('mem1')?.isHost).toBe(true);
    expect(events.onHostChanged).toHaveBeenCalledWith(
      expect.any(Object),
      'host',
      'mem1',
      'fallback',
    );
  });

  it('último player sai do lobby → sala abandonada, abandonedAt setado', () => {
    manager.leaveRoom(room.code, 'mem1');
    manager.leaveRoom(room.code, 'mem2');
    const r = manager.leaveRoom(room.code, 'host');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.room).not.toBeNull();
    expect(room.status).toBe('abandoned');
    expect(room.abandonedAt).toBeDefined();
    expect(events.onRoomAbandoned).toHaveBeenCalledOnce();
  });

  it('player não está na sala → PLAYER_NOT_IN_ROOM', () => {
    const r = manager.leaveRoom(room.code, 'ghost');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('PLAYER_NOT_IN_ROOM');
  });

  it('sala inexistente → ROOM_NOT_FOUND', () => {
    const r = manager.leaveRoom('XXXX', 'host');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('ROOM_NOT_FOUND');
  });

  it('último player sai de ended → sala destruída imediatamente, room=null', () => {
    manager.leaveRoom(room.code, 'mem1');
    manager.leaveRoom(room.code, 'mem2');
    forceStatus(room, 'ended');
    const r = manager.leaveRoom(room.code, 'host');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.room).toBeNull();
    expect(manager.getRoom(room.code)).toBeNull();
    expect(events.onRoomDestroyed).toHaveBeenCalledWith(room.code);
  });
});

describe('RoomManager.kickPlayer', () => {
  let manager: RoomManager;
  let events: EventSpies;
  let room: Room;

  beforeEach(() => {
    const s = setup();
    manager = s.manager;
    events = s.events;
    room = createRoom(manager, 'host', 'Host');
    joinAs(manager, room.code, 'mem1', 'Mem1');
  });

  it('host kicka member → member removido, onPlayerLeft kick', () => {
    const r = manager.kickPlayer(room.code, 'host', 'mem1');
    expect(r.ok).toBe(true);
    expect(room.players.has('mem1')).toBe(false);
    expect(events.onPlayerLeft).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'kick',
    );
  });

  it('non-host tenta kickar → NOT_HOST', () => {
    const r = manager.kickPlayer(room.code, 'mem1', 'host');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NOT_HOST');
  });

  it('host tenta kickar a si mesmo → CANNOT_KICK_SELF', () => {
    const r = manager.kickPlayer(room.code, 'host', 'host');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('CANNOT_KICK_SELF');
  });

  it('kick em player inexistente → PLAYER_NOT_IN_ROOM', () => {
    const r = manager.kickPlayer(room.code, 'host', 'ghost');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('PLAYER_NOT_IN_ROOM');
  });
});

describe('RoomManager.transferHost', () => {
  let manager: RoomManager;
  let events: EventSpies;
  let room: Room;

  beforeEach(() => {
    const s = setup();
    manager = s.manager;
    events = s.events;
    room = createRoom(manager, 'host', 'Host');
    joinAs(manager, room.code, 'mem1', 'Mem1');
  });

  it('host transfere em lobby → host muda, onHostChanged manual', () => {
    const r = manager.transferHost(room.code, 'host', 'mem1');
    expect(r.ok).toBe(true);
    expect(room.hostUserId).toBe('mem1');
    expect(room.players.get('host')?.isHost).toBe(false);
    expect(room.players.get('mem1')?.isHost).toBe(true);
    expect(events.onHostChanged).toHaveBeenCalledWith(
      expect.any(Object),
      'host',
      'mem1',
      'manual',
    );
  });

  it('host transfere durante playing → HOST_TRANSFER_NOT_ALLOWED', () => {
    forceStatus(room, 'playing');
    const r = manager.transferHost(room.code, 'host', 'mem1');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('HOST_TRANSFER_NOT_ALLOWED');
  });

  it('non-host tenta transferir → NOT_HOST', () => {
    const r = manager.transferHost(room.code, 'mem1', 'host');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NOT_HOST');
  });

  it('host transfere pra si mesmo → CANNOT_TRANSFER_TO_SELF', () => {
    const r = manager.transferHost(room.code, 'host', 'host');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('CANNOT_TRANSFER_TO_SELF');
  });

  it('host transfere pra player inexistente → PLAYER_NOT_IN_ROOM', () => {
    const r = manager.transferHost(room.code, 'host', 'ghost');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('PLAYER_NOT_IN_ROOM');
  });
});

describe('RoomManager — desconexão e reconexão', () => {
  let manager: RoomManager;
  let events: EventSpies;
  let room: Room;

  beforeEach(() => {
    const s = setup();
    manager = s.manager;
    events = s.events;
    room = createRoom(manager, 'host', 'Host');
    joinAs(manager, room.code, 'mem1', 'Mem1');
  });

  it('markPlayerDisconnected marca isConnected=false e seta disconnectedAt', () => {
    manager.markPlayerDisconnected(room.code, 'mem1', 5_000);
    const p = room.players.get('mem1');
    expect(p?.isConnected).toBe(false);
    expect(p?.disconnectedAt).toBe(5_000);
    expect(events.onPlayerDisconnected).toHaveBeenCalledOnce();
  });

  it('markPlayerReconnected dentro do grace → isConnected=true', () => {
    manager.markPlayerDisconnected(room.code, 'mem1', 0);
    const r = manager.markPlayerReconnected(room.code, 'mem1', 5_000);
    expect(r.ok).toBe(true);
    const p = room.players.get('mem1');
    expect(p?.isConnected).toBe(true);
    expect(p?.disconnectedAt).toBeUndefined();
    expect(events.onPlayerReconnected).toHaveBeenCalledOnce();
  });

  it('markPlayerReconnected após tick (player removido) → PLAYER_NOT_IN_ROOM', () => {
    manager.markPlayerDisconnected(room.code, 'mem1', 0);
    manager.tick(11_000); // > grace (10_000)
    expect(room.players.has('mem1')).toBe(false);
    const r = manager.markPlayerReconnected(room.code, 'mem1', 12_000);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('PLAYER_NOT_IN_ROOM');
  });

  it('host desconecta — fallback NÃO ocorre até tick após grace', () => {
    manager.markPlayerDisconnected(room.code, 'host', 0);
    expect(room.hostUserId).toBe('host');
    expect(events.onHostChanged).not.toHaveBeenCalled();

    manager.tick(5_000); // < grace
    expect(room.hostUserId).toBe('host');
    expect(events.onHostChanged).not.toHaveBeenCalled();

    manager.tick(11_000); // > grace
    expect(room.hostUserId).toBe('mem1');
    expect(events.onHostChanged).toHaveBeenCalledWith(
      expect.any(Object),
      'host',
      'mem1',
      'fallback',
    );
  });

  it('host desconecta e reconecta dentro do grace → retoma como host, sem onHostChanged', () => {
    manager.markPlayerDisconnected(room.code, 'host', 0);
    manager.markPlayerReconnected(room.code, 'host', 5_000);
    expect(room.hostUserId).toBe('host');
    expect(room.players.get('host')?.isHost).toBe(true);
    expect(events.onHostChanged).not.toHaveBeenCalled();
  });
});

describe('RoomManager.transitionTo / systemTransition', () => {
  let manager: RoomManager;
  let events: EventSpies;
  let room: Room;

  beforeEach(() => {
    const s = setup();
    manager = s.manager;
    events = s.events;
    room = createRoom(manager, 'host', 'Host');
    joinAs(manager, room.code, 'mem1', 'Mem1');
  });

  it('lobby → countdown como host → OK', () => {
    const r = manager.transitionTo(room.code, 'host', 'countdown');
    expect(r.ok).toBe(true);
    expect(room.status).toBe('countdown');
    expect(events.onStatusChanged).toHaveBeenCalledWith(
      expect.any(Object),
      'lobby',
      'countdown',
    );
  });

  it('lobby → countdown como non-host → NOT_HOST', () => {
    const r = manager.transitionTo(room.code, 'mem1', 'countdown');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('NOT_HOST');
  });

  it('lobby → playing direto via transitionTo → INVALID_STATUS_TRANSITION', () => {
    const r = manager.transitionTo(room.code, 'host', 'playing');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('countdown → playing via systemTransition → OK (sem check de host)', () => {
    manager.transitionTo(room.code, 'host', 'countdown');
    const r = manager.systemTransition(room.code, 'playing');
    expect(r.ok).toBe(true);
    expect(room.status).toBe('playing');
  });

  it('ended → lobby como host → OK', () => {
    forceStatus(room, 'ended');
    const r = manager.transitionTo(room.code, 'host', 'lobby');
    expect(r.ok).toBe(true);
    expect(room.status).toBe('lobby');
  });

  it('systemTransition em transição inválida → INVALID_STATUS_TRANSITION', () => {
    const r = manager.systemTransition(room.code, 'playing'); // lobby→playing não está em SYSTEM
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('INVALID_STATUS_TRANSITION');
  });
});

describe('RoomManager.tick', () => {
  let manager: RoomManager;
  let events: EventSpies;
  let room: Room;

  beforeEach(() => {
    const s = setup();
    manager = s.manager;
    events = s.events;
    room = createRoom(manager, 'host', 'Host');
    joinAs(manager, room.code, 'mem1', 'Mem1');
  });

  it('player desconectado há > grace → removido com reason=disconnect_timeout', () => {
    manager.markPlayerDisconnected(room.code, 'mem1', 0);
    manager.tick(11_000);
    expect(room.players.has('mem1')).toBe(false);
    expect(events.onPlayerLeft).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'disconnect_timeout',
    );
  });

  it('player desconectado há < grace → mantido', () => {
    manager.markPlayerDisconnected(room.code, 'mem1', 0);
    manager.tick(5_000);
    expect(room.players.has('mem1')).toBe(true);
    expect(events.onPlayerLeft).not.toHaveBeenCalled();
  });

  it('sala abandoned há > ABANDONED_DESTROY_MS → destruída, onRoomDestroyed', () => {
    manager.leaveRoom(room.code, 'mem1');
    manager.leaveRoom(room.code, 'host');
    expect(room.status).toBe('abandoned');
    const abandonedAt = room.abandonedAt!;
    manager.tick(abandonedAt + RoomManager.ABANDONED_DESTROY_MS + 1);
    expect(manager.getRoom(room.code)).toBeNull();
    expect(events.onRoomDestroyed).toHaveBeenCalledWith(room.code);
  });

  it('tick idempotente: chamadas repetidas com mesmo now não duplicam efeitos', () => {
    manager.markPlayerDisconnected(room.code, 'mem1', 0);
    manager.tick(11_000);
    manager.tick(11_000);
    manager.tick(11_000);
    expect(events.onPlayerLeft).toHaveBeenCalledTimes(1);
    expect(events.onRoomAbandoned).toHaveBeenCalledTimes(0);
  });

  it('tick com 0 salas é noop', () => {
    const { manager: empty, events: emptyEvents } = setup();
    empty.tick(1_000_000);
    expect(emptyEvents.onPlayerLeft).not.toHaveBeenCalled();
    expect(emptyEvents.onRoomDestroyed).not.toHaveBeenCalled();
  });
});
