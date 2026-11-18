import { ConvexClient } from 'convex/browser';
import { anyApi } from 'convex/server';
import { RaceState, type RacerSnapshot } from './race-state.js';

const api = anyApi;
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/u;

export class MultiplayerSession {
  readonly playerId = crypto.randomUUID();
  private readonly playerToken = `${crypto.randomUUID().replace(/-/gu, '')}${crypto.randomUUID().replace(/-/gu, '')}`;
  private readonly client: ConvexClient | null;
  private unsubscribeRacers: (() => void) | null = null;
  private sending = false;
  private readonly handlePageHide = (): void => {
    void this.leaveRoom();
  };

  constructor(private readonly state: RaceState) {
    state.playerId = this.playerId;
    const url = import.meta.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      state.connection = 'offline';
      state.setNotice('Practice ride ready. Multiplayer is not configured in this environment.');
      this.client = null;
      return;
    }

    this.client = new ConvexClient(url);
    state.connection = 'connecting';
    state.notify();
    window.addEventListener('pagehide', this.handlePageHide);
  }

  async createRoom(displayName: string): Promise<string | null> {
    if (!this.client) {
      this.state.connection = 'offline';
      this.state.setNotice('Multiplayer is unavailable. You can still ride in Practice mode.');
      return null;
    }

    const name = normalizeDisplayName(displayName);
    this.state.connection = 'connecting';
    this.state.displayName = name;
    this.state.notify();
    try {
      const roomCode = createRoomCode();
      await this.client.mutation(api.race.createRoom, {
        roomCode,
        playerId: this.playerId,
        playerToken: this.playerToken,
        displayName: name,
      });
      this.subscribeToRoom(roomCode);
      this.state.connection = 'online';
      this.state.setNotice(`Room ${roomCode} is ready. Share the code with your riders.`);
      return roomCode;
    } catch (error) {
      this.state.connection = 'error';
      this.state.setNotice(getErrorMessage(error, 'Could not create a race room.'));
      this.state.notify();
      return null;
    }
  }

  async joinRoom(roomCodeInput: string, displayName: string): Promise<boolean> {
    if (!this.client) {
      this.state.connection = 'offline';
      this.state.setNotice('Multiplayer is unavailable. You can still ride in Practice mode.');
      return false;
    }

    const roomCode = roomCodeInput.trim().toUpperCase();
    if (!ROOM_CODE_PATTERN.test(roomCode)) {
      this.state.setNotice('Enter a valid six-character room code.');
      return false;
    }

    this.state.connection = 'connecting';
    this.state.displayName = normalizeDisplayName(displayName);
    this.state.notify();
    try {
      await this.client.mutation(api.race.joinRoom, {
        roomCode,
        playerId: this.playerId,
        playerToken: this.playerToken,
        displayName: this.state.displayName,
      });
      this.subscribeToRoom(roomCode);
      this.state.connection = 'online';
      this.state.setNotice(`Joined room ${roomCode}. Start when you are ready.`);
      return true;
    } catch (error) {
      this.state.connection = 'error';
      this.state.setNotice(getErrorMessage(error, 'Could not join that race room.'));
      this.state.notify();
      return false;
    }
  }

  publish(): void {
    const client = this.client;
    const roomCode = this.state.roomCode;
    if (!client || !roomCode || this.sending) {
      return;
    }

    this.sending = true;
    void client.mutation(api.race.updateRacer, {
      roomCode,
      playerId: this.playerId,
      playerToken: this.playerToken,
      lane: this.state.lane,
      distance: this.state.distance,
      speed: this.state.speed,
      score: this.state.score,
      boostCount: this.state.boostCount,
    }).catch((error: unknown) => {
      this.state.connection = 'error';
      this.state.setNotice(getErrorMessage(error, 'Race sync paused.'));
    }).finally(() => {
      this.sending = false;
    });
  }

  async fireShot(targetPlayerId: string): Promise<boolean> {
    const client = this.client;
    const roomCode = this.state.roomCode;
    if (!client || !roomCode) {
      return false;
    }

    try {
      const hit = await client.mutation(api.race.fireShot, {
        roomCode,
        playerId: this.playerId,
        playerToken: this.playerToken,
        targetPlayerId,
      });
      return Boolean(hit);
    } catch (error) {
      this.state.setNotice(getErrorMessage(error, 'Pulse could not reach the room.'));
      return false;
    }
  }

  async leaveRoom(): Promise<void> {
    const roomCode = this.state.roomCode;
    this.unsubscribeRacers?.();
    this.unsubscribeRacers = null;
    this.state.roomCode = '';
    this.state.racers = [];
    this.state.connection = this.client ? 'online' : 'offline';
    this.state.notify();

    if (!this.client || !roomCode) {
      return;
    }
    try {
      await this.client.mutation(api.race.leaveRoom, {
        roomCode,
        playerId: this.playerId,
        playerToken: this.playerToken,
      });
    } catch {
      this.state.setNotice('Left the room on this device.');
    }
  }

  async close(): Promise<void> {
    window.removeEventListener('pagehide', this.handlePageHide);
    await this.leaveRoom();
    await this.client?.close();
  }

  private subscribeToRoom(roomCode: string): void {
    this.unsubscribeRacers?.();
    this.state.roomCode = roomCode;
    this.unsubscribeRacers = this.client?.onUpdate(
      api.race.listRacers,
      { roomCode },
      (racers: RacerSnapshot[]) => {
        this.state.racers = racers;
        this.state.connection = 'online';
        this.state.notify();
      },
      (error: Error) => {
        this.state.connection = 'error';
        this.state.setNotice(getErrorMessage(error, 'Room updates are unavailable.'));
      },
    ) ?? null;
  }
}

function createRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let roomCode = '';
  for (let index = 0; index < bytes.length; index += 1) {
    roomCode += ROOM_ALPHABET[bytes[index] % ROOM_ALPHABET.length];
  }
  return roomCode;
}

function normalizeDisplayName(displayName: string): string {
  const cleaned = displayName.replace(/[<>\u0000-\u001f]/gu, '').trim().slice(0, 18);
  return cleaned || 'Trail Rider';
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
