import { createSystem, InputComponent, Vector3 } from '@iwsdk/core';
import { RaceState } from './race-state.js';

export class HandRideSystem extends createSystem({}) {
  private state!: RaceState;
  private leftWorld!: Vector3;
  private rightWorld!: Vector3;
  private neutralLeft!: Vector3;
  private neutralRight!: Vector3;
  private calibrated = false;
  private filteredThrottle = 0;
  private filteredBrake = 0;
  private filteredSteer = 0;

  init(): void {
    this.state = this.globals.raceState as RaceState;
    this.leftWorld = new Vector3();
    this.rightWorld = new Vector3();
    this.neutralLeft = new Vector3();
    this.neutralRight = new Vector3();
  }

  update(delta: number): void {
    const session = this.world.session;
    if (!session) {
      this.state.handsReady = false;
      this.calibrated = false;
      this.filteredThrottle = this.state.previewInputs.throttle;
      this.filteredBrake = this.state.previewInputs.brake;
      this.filteredSteer = this.state.previewInputs.steer;
      this.applyControls();
      return;
    }

    let hasTrackedHands = false;
    for (const source of session.inputSources) {
      if (source.hand) {
        hasTrackedHands = true;
        break;
      }
    }

    if (!hasTrackedHands) {
      this.state.handsReady = false;
      this.calibrated = false;
      this.filteredThrottle = 0;
      this.filteredBrake = 0;
      this.filteredSteer = 0;
      this.applyControls();
      return;
    }

    this.player.updateWorldMatrix(true, false);
    this.player.indexTipSpaces.left.getWorldPosition(this.leftWorld);
    this.player.indexTipSpaces.right.getWorldPosition(this.rightWorld);
    this.player.worldToLocal(this.leftWorld);
    this.player.worldToLocal(this.rightWorld);

    if (!this.calibrated) {
      this.neutralLeft.copy(this.leftWorld);
      this.neutralRight.copy(this.rightWorld);
      this.calibrated = true;
      this.state.handsReady = true;
      this.state.setNotice('Hands calibrated. Push your right hand forward to ride.');
      this.applyControls();
      return;
    }

    const throttleInput = clamp((this.neutralRight.z - this.rightWorld.z - 0.025) / 0.24, 0, 1);
    const brakeInput = clamp((this.leftWorld.z - this.neutralLeft.z - 0.025) / 0.2, 0, 1);
    const lateralShift = (
      this.leftWorld.x - this.neutralLeft.x +
      this.rightWorld.x - this.neutralRight.x
    ) * 0.5;
    const steerInput = clamp(lateralShift / 0.18, -1, 1);
    const smoothing = Math.min(delta * 9, 1);

    this.filteredThrottle += (throttleInput - this.filteredThrottle) * smoothing;
    this.filteredBrake += (brakeInput - this.filteredBrake) * smoothing;
    this.filteredSteer += (steerInput - this.filteredSteer) * smoothing;
    this.state.handsReady = true;

    if (this.input.xr.gamepads.left?.getButtonDown(InputComponent.Squeeze)) {
      this.state.fireRequested = true;
    }
    this.applyControls();
  }

  private applyControls(): void {
    this.state.throttle = this.filteredThrottle;
    this.state.brake = this.filteredBrake;
    this.state.steer = this.filteredSteer;
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
