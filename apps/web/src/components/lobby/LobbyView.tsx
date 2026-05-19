'use client';

import type { RoomSnapshot } from '@soms/shared';
import { useIdentity } from '@/stores/identity';
import { LeaveButton } from './LeaveButton';
import { PlayerList } from './PlayerList';
import { RoomCodeHero } from './RoomCodeHero';
import { SettingsPanel } from './SettingsPanel';
import { StartButton } from './StartButton';

export function LobbyView({
  snapshot,
}: {
  snapshot: RoomSnapshot;
}): React.ReactElement {
  const userId = useIdentity((s) => s.userId);
  const isHost = snapshot.hostUserId === userId;

  return (
    <main className="paper min-h-screen p-8">
      <div className="flex justify-end mb-4">
        <LeaveButton />
      </div>

      <div className="flex justify-center mb-12">
        <RoomCodeHero code={snapshot.code} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
        <PlayerList
          players={snapshot.players}
          hostUserId={snapshot.hostUserId}
          currentUserId={userId ?? ''}
        />
        <SettingsPanel settings={snapshot.settings} canEdit={isHost} />
      </div>

      {isHost ? (
        <div className="flex justify-center">
          <StartButton
            disabled={snapshot.status !== 'lobby'}
            playerCount={snapshot.players.length}
          />
        </div>
      ) : null}
    </main>
  );
}
