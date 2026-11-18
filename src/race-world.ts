import {
  createSystem,
  Group,
  OneHandGrabbable,
  RayInteractable,
} from '@iwsdk/core';
import { RacePickup, RaceRival, TrackSegment } from './race-components.js';
import { RaceState } from './race-state.js';

const SEGMENT_LENGTH = 48;
const SEGMENT_COUNT = 4;
const MAX_SPEED = 72;

export class RaceWorldSystem extends createSystem({
  segments: { required: [TrackSegment] },
  rivals: { required: [RaceRival] },
}) {
  private state!: RaceState;
  private speed = 0;
  private distance = 0;
  private lane = 0;
  private lastStateNotice = 0;

  init(): void {
    this.state = this.globals.raceState as RaceState;
    void this.setupWorld().catch((error: unknown) => {
      console.error('[Trail Rush] World setup failed:', error);
      this.state.setNotice('The course could not load. Refresh to try again.');
    });
  }

  update(delta: number, time: number): void {
    if (this.state.running) {
      const boost = time < this.state.boostUntil ? 18 : 0;
      const acceleration = this.state.throttle * 34 + boost;
      const braking = this.state.brake * 62;
      const drag = 2.4 + this.speed * 0.11;
      this.speed = clamp(this.speed + (acceleration - braking - drag) * delta, 0, MAX_SPEED);
      this.distance += (this.speed / 3.6) * delta;
      this.lane = clamp(this.lane + this.state.steer * delta * 0.72, -1, 1);
    } else {
      this.speed = Math.max(0, this.speed - delta * 12);
    }

    this.state.speed = this.speed;
    this.state.distance = this.distance;
    this.state.lane = this.lane;

    const travel = this.state.running ? (this.speed / 3.6) * delta : 0;
    for (const entity of this.queries.segments.entities) {
      const object = entity.object3D;
      if (!object) {
        continue;
      }
      object.position.x = -this.lane * 1.25;
      object.position.z += travel;
      if (object.position.z > SEGMENT_LENGTH / 2) {
        object.position.z -= SEGMENT_LENGTH * SEGMENT_COUNT;
      }
    }

    for (const entity of this.queries.rivals.entities) {
      if (!entity.getValue(RaceRival, 'isBot')) {
        continue;
      }
      const object = entity.object3D;
      if (!object) {
        continue;
      }
      const botSpeed = entity.getValue(RaceRival, 'playerId') === 'bot-summit' ? 9.2 : 7.4;
      object.position.z += (this.state.running ? this.speed / 3.6 - botSpeed : -botSpeed * 0.18) * delta;
      if (object.position.z > 2) {
        object.position.z = -42;
      } else if (object.position.z < -46) {
        object.position.z = -8;
      }
      const rivalLane = entity.getValue(RaceRival, 'lane') ?? 0;
      object.position.x = rivalLane * 2 - this.lane * 1.25;
      const stunnedUntil = entity.getValue(RaceRival, 'stunnedUntil') ?? 0;
      object.rotation.z = stunnedUntil > time ? Math.sin(time * 16) * 0.13 : 0;
      entity.setValue(RaceRival, 'distance', this.distance + Math.max(0, -object.position.z) * 0.6);
    }

    if (time - this.lastStateNotice >= 0.1) {
      this.lastStateNotice = time;
      this.state.notify();
    }
  }

  private async setupWorld(): Promise<void> {
    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      const segment = await this.world.assets.instantiate<Group>('race-course');
      segment.position.set(0, 0, -index * SEGMENT_LENGTH);
      const entity = this.world.createTransformEntity(segment);
      entity.addComponent(TrackSegment, { length: SEGMENT_LENGTH, index });
    }

    const cockpit = await this.world.assets.instantiate<Group>('bike-cockpit');
    cockpit.position.set(0, -0.48, -0.72);
    cockpit.scale.setScalar(0.78);
    this.world.createTransformEntity(cockpit, this.world.cameraEntity);

    for (let slot = 0; slot < 3; slot += 1) {
      const token = await this.world.assets.instantiate<Group>('boost-token');
      token.position.set([-1.4, 0.9, 1.4][slot], 1.18, -12 - slot * 11);
      const entity = this.world.createTransformEntity(token);
      entity.addComponent(RacePickup, { slot, collected: false, respawnAt: 0 });
      entity.addComponent(RayInteractable, {});
      entity.addComponent(OneHandGrabbable, {});
    }

    await this.addBot('bot-summit', 'Summit', -1, -15);
    await this.addBot('bot-fern', 'Fern', 1, -29);
  }

  private async addBot(playerId: string, displayName: string, lane: number, z: number): Promise<void> {
    const rider = await this.world.assets.instantiate<Group>('race-cyclist');
    rider.position.set(lane * 2, 0, z);
    rider.rotation.y = Math.PI;
    rider.scale.setScalar(0.78);
    const entity = this.world.createTransformEntity(rider);
    entity.addComponent(RaceRival, {
      playerId,
      displayName,
      isBot: true,
      lane,
      distance: 0,
      stunnedUntil: 0,
    });
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
