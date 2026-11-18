import {
  createSystem,
  Entity,
  Grabbed,
  GrabSystem,
} from '@iwsdk/core';
import { RacePickup } from './race-components.js';
import { RaceState } from './race-state.js';

export class PickupSystem extends createSystem({
  pickups: { required: [RacePickup] },
}) {
  private state!: RaceState;
  private grabSystem?: GrabSystem;

  init(): void {
    this.state = this.globals.raceState as RaceState;
    this.grabSystem = this.world.getSystem(GrabSystem);
  }

  update(_delta: number, time: number): void {
    const previewCollect = this.state.collectRequested && this.state.running;
    this.state.collectRequested = false;
    let previewTarget: Entity | null = null;
    let previewTargetDistance = Number.POSITIVE_INFINITY;

    if (previewCollect) {
      for (const entity of this.queries.pickups.entities) {
        const object = entity.object3D;
        if (entity.getValue(RacePickup, 'collected') || !object?.visible) {
          continue;
        }
        const z = object.position.z;
        if (z < 1 && z > -34 && Math.abs(z) < previewTargetDistance) {
          previewTarget = entity;
          previewTargetDistance = Math.abs(z);
        }
      }
    }

    for (const entity of this.queries.pickups.entities) {
      const object = entity.object3D;
      if (!object) {
        continue;
      }

      const collected = entity.getValue(RacePickup, 'collected');
      if (collected) {
        if (time >= (entity.getValue(RacePickup, 'respawnAt') ?? 0)) {
          const slot = entity.getValue(RacePickup, 'slot') ?? 0;
          object.position.set([-1.4, 0.9, 1.4][slot % 3], 1.18, -25 - slot * 10);
          object.visible = true;
          entity.setValue(RacePickup, 'collected', false);
        }
        continue;
      }

      if (!this.state.running) {
        continue;
      }

      const slot = entity.getValue(RacePickup, 'slot') ?? 0;
      object.position.x = [-1.4, 0.9, 1.4][slot % 3] - this.state.lane * 0.8;
      object.position.z += (this.state.speed / 3.6) * _delta;
      const wasGrabbed = entity.hasComponent(Grabbed);
      if (wasGrabbed || entity === previewTarget) {
        this.collect(entity, time);
      } else if (object.position.z > 2) {
        const slot = entity.getValue(RacePickup, 'slot') ?? 0;
        object.position.set([-1.4, 0.9, 1.4][slot % 3], 1.18, -46 - slot * 8);
      }
    }
  }

  private collect(entity: Entity, time: number): void {
    const object = entity.object3D;
    if (!object || entity.getValue(RacePickup, 'collected')) {
      return;
    }

    entity.setValue(RacePickup, 'collected', true);
    entity.setValue(RacePickup, 'respawnAt', time + 3.8);
    this.grabSystem?.forceRelease(entity);
    object.visible = false;
    this.state.boostUntil = time + 2.7;
    this.state.boostCount += 1;
    this.state.score += 250;
    this.state.setNotice('BOOST CHARGED · acceleration burst ready');
  }
}
