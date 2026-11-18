import { createSystem, Entity, Group } from '@iwsdk/core';
import { RaceRival } from './race-components.js';
import { MultiplayerSession } from './multiplayer.js';
import { RaceState, type RacerSnapshot } from './race-state.js';

export class NetworkSystem extends createSystem({
  rivals: { required: [RaceRival] },
}) {
  private state!: RaceState;
  private multiplayer!: MultiplayerSession;
  private lastPublish = 0;
  private lastReconcile = 0;
  private pendingPlayers = new Set<string>();

  init(): void {
    this.state = this.globals.raceState as RaceState;
    this.multiplayer = this.globals.multiplayer as MultiplayerSession;
  }

  update(_delta: number, time: number): void {
    if (this.state.roomCode && time - this.lastPublish >= 0.25) {
      this.lastPublish = time;
      this.multiplayer.publish();
    }
    if (time - this.lastReconcile < 0.35) {
      return;
    }
    this.lastReconcile = time;

    for (const snapshot of this.state.racers) {
      if (snapshot.playerId === this.state.playerId) {
        continue;
      }
      const entity = this.findRacer(snapshot.playerId);
      if (entity) {
        this.applySnapshot(entity, snapshot, time);
      } else if (!this.pendingPlayers.has(snapshot.playerId)) {
        this.pendingPlayers.add(snapshot.playerId);
        void this.spawnRacer(snapshot).finally(() => this.pendingPlayers.delete(snapshot.playerId));
      }
    }

    for (const entity of this.queries.rivals.entities) {
      if (entity.getValue(RaceRival, 'isBot')) {
        continue;
      }
      const playerId = entity.getValue(RaceRival, 'playerId');
      if (playerId && !this.hasSnapshot(playerId)) {
        entity.dispose({ disposeResources: false });
      }
    }
  }

  private hasSnapshot(playerId: string): boolean {
    for (const racer of this.state.racers) {
      if (racer.playerId === playerId) {
        return true;
      }
    }
    return false;
  }

  private findRacer(playerId: string): Entity | null {
    for (const entity of this.queries.rivals.entities) {
      if (!entity.getValue(RaceRival, 'isBot') && entity.getValue(RaceRival, 'playerId') === playerId) {
        return entity;
      }
    }
    return null;
  }

  private async spawnRacer(snapshot: RacerSnapshot): Promise<void> {
    try {
      const rider = await this.world.assets.instantiate<Group>('race-cyclist');
      rider.scale.setScalar(0.78);
      rider.rotation.y = Math.PI;
      const entity = this.world.createTransformEntity(rider);
      entity.addComponent(RaceRival, {
        playerId: snapshot.playerId,
        displayName: snapshot.displayName,
        isBot: false,
        lane: snapshot.lane,
        distance: snapshot.distance,
        stunnedUntil: snapshot.stunnedUntil,
      });
      this.applySnapshot(entity, snapshot, 0);
    } catch (error) {
      console.error('[Trail Rush] Could not create a remote rider:', error);
    }
  }

  private applySnapshot(entity: Entity, snapshot: RacerSnapshot, time: number): void {
    const object = entity.object3D;
    if (!object) {
      return;
    }
    entity.setValue(RaceRival, 'displayName', snapshot.displayName);
    entity.setValue(RaceRival, 'lane', snapshot.lane);
    entity.setValue(RaceRival, 'distance', snapshot.distance);
    entity.setValue(RaceRival, 'stunnedUntil', snapshot.stunnedUntil);

    const distanceGap = snapshot.distance - this.state.distance;
    const depth = clamp(19 - distanceGap * 0.42, 4, 42);
    object.position.set(snapshot.lane * 2 - this.state.lane * 1.25, 0, -depth);
    object.rotation.z = snapshot.stunnedUntil > Date.now() ? Math.sin(time * 14) * 0.15 : 0;
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
