import { createSystem, Entity, Group } from '@iwsdk/core';
import { PulseShot, RaceRival } from './race-components.js';
import { MultiplayerSession } from './multiplayer.js';
import { RaceState } from './race-state.js';

export class CombatSystem extends createSystem({
  rivals: { required: [RaceRival] },
  pulses: { required: [PulseShot] },
}) {
  private state!: RaceState;
  private multiplayer!: MultiplayerSession;
  private nextShotAt = 0;

  init(): void {
    this.state = this.globals.raceState as RaceState;
    this.multiplayer = this.globals.multiplayer as MultiplayerSession;
    void this.createPulse();
  }

  update(delta: number, time: number): void {
    for (const entity of this.queries.pulses.entities) {
      if (!entity.getValue(PulseShot, 'active')) {
        continue;
      }
      const age = (entity.getValue(PulseShot, 'age') ?? 0) + delta;
      entity.setValue(PulseShot, 'age', age);
      if (age >= 0.48) {
        entity.setValue(PulseShot, 'active', false);
        if (entity.object3D) {
          entity.object3D.visible = false;
        }
      } else if (entity.object3D) {
        entity.object3D.position.z -= delta * 18;
      }
    }

    if (!this.state.fireRequested) {
      return;
    }
    this.state.fireRequested = false;
    if (!this.state.running || time < this.nextShotAt) {
      return;
    }
    this.nextShotAt = time + 0.82;
    this.playPulse();

    let target: Entity | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const entity of this.queries.rivals.entities) {
      const object = entity.object3D;
      if (!object || object.position.z > 2 || object.position.z < -24) {
        continue;
      }
      const distance = Math.abs(object.position.z);
      if (distance < closestDistance) {
        target = entity;
        closestDistance = distance;
      }
    }

    if (!target) {
      this.state.setNotice('Pulse fired · get a rival within range to land a hit.');
      return;
    }

    const playerId = target.getValue(RaceRival, 'playerId');
    const displayName = target.getValue(RaceRival, 'displayName') ?? 'Rival';
    if (!playerId) {
      this.state.setNotice('Rival is no longer in the race.');
      return;
    }
    if (target.getValue(RaceRival, 'isBot')) {
      target.setValue(RaceRival, 'stunnedUntil', time + 1.4);
      this.state.score += 100;
      this.state.setNotice(`${displayName} tagged · +100 points`);
      return;
    }

    void this.multiplayer.fireShot(playerId).then((hit) => {
      if (hit) {
        this.state.score += 100;
        this.state.setNotice(`${displayName} tagged · +100 points`);
      } else {
        this.state.setNotice('Pulse missed · line up a rider and fire again.');
      }
    });
  }

  private async createPulse(): Promise<void> {
    const pulse = await this.world.assets.instantiate<Group>('pulse-shot');
    pulse.position.set(0, -0.11, -0.8);
    pulse.visible = false;
    const entity = this.world.createTransformEntity(pulse, this.world.cameraEntity);
    entity.addComponent(PulseShot, { age: 0, active: false });
  }

  private playPulse(): void {
    for (const entity of this.queries.pulses.entities) {
      if (entity.getValue(PulseShot, 'active')) {
        continue;
      }
      entity.setValue(PulseShot, 'age', 0);
      entity.setValue(PulseShot, 'active', true);
      if (entity.object3D) {
        entity.object3D.position.set(0, -0.11, -0.8);
        entity.object3D.visible = true;
      }
      break;
    }
  }
}
