export type ConnectionStatus = 'practice' | 'connecting' | 'online' | 'offline' | 'error';

export type RacerSnapshot = {
  playerId: string;
  displayName: string;
  lane: number;
  distance: number;
  speed: number;
  score: number;
  boostCount: number;
  stunnedUntil: number;
  lastSeen: number;
};

export class RaceState extends EventTarget {
  running = false;
  speed = 0;
  distance = 0;
  lane = 0;
  throttle = 0;
  brake = 0;
  steer = 0;
  boostUntil = 0;
  boostCount = 0;
  score = 0;
  fireRequested = false;
  collectRequested = false;
  handsReady = false;
  notice = 'Sit comfortably and join the trail.';
  connection: ConnectionStatus = 'practice';
  roomCode = '';
  playerId = '';
  displayName = 'Trail Rider';
  racers: RacerSnapshot[] = [];
  readonly previewInputs = { throttle: 0, brake: 0, steer: 0 };

  notify(): void {
    this.dispatchEvent(new Event('change'));
  }

  setNotice(notice: string): void {
    this.notice = notice;
    this.notify();
  }
}
