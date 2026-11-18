import { createSystem, UIKit, UIKitMLAsset } from '@iwsdk/core';
import { RaceState } from './race-state.js';

const HUD_INTERVAL = 0.1;

export class RaceHudSystem extends createSystem({}) {
  private state!: RaceState;
  private lastRefresh = 0;
  private speed?: UIKit.Text;
  private distance?: UIKit.Text;
  private score?: UIKit.Text;
  private boosts?: UIKit.Text;
  private room?: UIKit.Text;
  private status?: UIKit.Text;

  init(): void {
    this.state = this.globals.raceState as RaceState;
    const panel = this.world.getSceneObject<UIKitMLAsset>('race-hud');
    this.speed = panel?.getElementById<UIKit.Text>('speed') ?? undefined;
    this.distance = panel?.getElementById<UIKit.Text>('distance') ?? undefined;
    this.score = panel?.getElementById<UIKit.Text>('score') ?? undefined;
    this.boosts = panel?.getElementById<UIKit.Text>('boosts') ?? undefined;
    this.room = panel?.getElementById<UIKit.Text>('room') ?? undefined;
    this.status = panel?.getElementById<UIKit.Text>('status') ?? undefined;
  }

  update(_delta: number, time: number): void {
    if (time - this.lastRefresh < HUD_INTERVAL) {
      return;
    }
    this.lastRefresh = time;
    this.speed?.setProperties({ text: Math.round(this.state.speed).toString() });
    this.distance?.setProperties({ text: `${Math.floor(this.state.distance)} m` });
    this.score?.setProperties({ text: this.state.score.toLocaleString() });
    this.boosts?.setProperties({ text: this.state.boostCount.toString() });
    this.room?.setProperties({ text: this.state.roomCode ? `ROOM ${this.state.roomCode}` : 'PRACTICE RIDE' });
    this.status?.setProperties({
      text: this.state.handsReady ? this.state.notice : 'Move both hands in front to calibrate.',
    });
  }
}
