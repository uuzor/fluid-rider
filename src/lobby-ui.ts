import { World } from '@iwsdk/core';
import { MultiplayerSession } from './multiplayer.js';
import { RaceState } from './race-state.js';

export function mountLobbyUi(state: RaceState, multiplayer: MultiplayerSession, world: World): () => void {
  const startScreen = getElement<HTMLDivElement>('start-screen');
  const raceHud = getElement<HTMLElement>('race-hud');
  const previewControls = getElement<HTMLElement>('preview-controls');
  const toast = getElement<HTMLDivElement>('toast');
  const enterVr = getElement<HTMLButtonElement>('enter-xr');
  const riderName = getElement<HTMLInputElement>('rider-name');
  const roomCode = getElement<HTMLInputElement>('room-code');
  const connectionPill = getElement<HTMLDivElement>('connection-pill');
  const connectionLabel = getElement<HTMLSpanElement>('connection-label');
  const speedValue = getElement<HTMLSpanElement>('speed-value');
  const distanceValue = getElement<HTMLDivElement>('distance-value');
  const scoreValue = getElement<HTMLDivElement>('score-value');
  const boostValue = getElement<HTMLDivElement>('boost-value');
  const notice = getElement<HTMLParagraphElement>('hud-notice');
  const leaderboard = getElement<HTMLDivElement>('leaderboard-list');
  const cleanup: Array<() => void> = [];
  let lastRenderedRoster: RaceState['racers'] | null = null;

  const addListener = <T extends EventTarget>(target: T, type: string, listener: EventListener): void => {
    target.addEventListener(type, listener);
    cleanup.push(() => target.removeEventListener(type, listener));
  };

  const update = (): void => {
    const hasRoom = state.roomCode.length > 0;
    const running = state.running;
    const immersive = world.session !== undefined;
    startScreen.hidden = running;
    raceHud.hidden = !running;
    previewControls.hidden = !running || immersive;
    connectionPill.dataset.state = state.connection;
    connectionLabel.textContent = connectionText(state.connection, hasRoom);
    speedValue.textContent = Math.round(state.speed).toString();
    distanceValue.textContent = `${Math.floor(state.distance).toLocaleString()} m`;
    scoreValue.textContent = state.score.toLocaleString();
    boostValue.textContent = state.boostCount.toString();
    notice.textContent = state.notice;
    toast.textContent = running ? '' : state.notice;
    getElement<HTMLButtonElement>('start-race').textContent = hasRoom ? 'Start race' : 'Start practice ride';
    enterVr.textContent = immersive ? 'Exit VR' : 'Enter VR';
    if (lastRenderedRoster !== state.racers) {
      lastRenderedRoster = state.racers;
      renderLeaderboard(leaderboard, state);
    }
  };

  const onStateChange = (): void => update();
  state.addEventListener('change', onStateChange);
  cleanup.push(() => state.removeEventListener('change', onStateChange));
  cleanup.push(world.visibilityState.subscribe(() => update()));

  addListener(enterVr, 'click', (() => {
    if (world.session) {
      world.exitXR();
    } else {
      world.launchXR();
    }
  }) as EventListener);

  addListener(getElement<HTMLButtonElement>('create-room'), 'click', (() => {
    void multiplayer.createRoom(riderName.value).then((createdCode) => {
      if (createdCode) {
        roomCode.value = createdCode;
      }
      update();
    });
  }) as EventListener);

  addListener(getElement<HTMLButtonElement>('join-room'), 'click', (() => {
    void multiplayer.joinRoom(roomCode.value, riderName.value).then(update);
  }) as EventListener);

  addListener(getElement<HTMLButtonElement>('start-race'), 'click', (() => {
    state.running = true;
    state.setNotice(state.roomCode ? `Room ${state.roomCode} · push your right hand forward to accelerate.` : 'Push your right hand forward to accelerate.');
    update();
  }) as EventListener);

  addListener(getElement<HTMLButtonElement>('leave-race'), 'click', (() => {
    state.running = false;
    state.speed = 0;
    state.setNotice('Back in the lobby. Join a room or start a practice ride.');
    void multiplayer.leaveRoom();
    update();
  }) as EventListener);

  const resetPreviewInputs = (): void => {
    state.previewInputs.throttle = 0;
    state.previewInputs.brake = 0;
    state.previewInputs.steer = 0;
  };

  for (const button of previewControls.querySelectorAll<HTMLButtonElement>('[data-control]')) {
    const control = button.dataset.control;
    const press = (event: Event): void => {
      event.preventDefault();
      if (control === 'throttle') state.previewInputs.throttle = 1;
      if (control === 'brake') state.previewInputs.brake = 1;
      if (control === 'left') state.previewInputs.steer = -1;
      if (control === 'right') state.previewInputs.steer = 1;
      if (control === 'fire') state.fireRequested = true;
      if (control === 'collect') state.collectRequested = true;
    };
    const release = (): void => {
      if (control === 'throttle') state.previewInputs.throttle = 0;
      if (control === 'brake') state.previewInputs.brake = 0;
      if (control === 'left' || control === 'right') state.previewInputs.steer = 0;
    };
    addListener(button, 'pointerdown', press as EventListener);
    addListener(button, 'pointerup', release as EventListener);
    addListener(button, 'pointercancel', release as EventListener);
    addListener(button, 'lostpointercapture', release as EventListener);
  }

  addListener(window, 'blur', resetPreviewInputs as EventListener);
  addListener(document, 'visibilitychange', resetPreviewInputs as EventListener);
  update();

  return () => {
    for (const dispose of cleanup) {
      dispose();
    }
  };
}

function connectionText(status: RaceState['connection'], hasRoom: boolean): string {
  if (status === 'connecting') return 'Connecting…';
  if (status === 'online') return hasRoom ? 'Room connected' : 'Online';
  if (status === 'offline' || status === 'error') return 'Practice mode';
  return 'Practice ride';
}

function renderLeaderboard(container: HTMLElement, state: RaceState): void {
  const racers = state.racers.slice().sort((left, right) => right.distance - left.distance).slice(0, 8);
  const rows: HTMLElement[] = [];
  for (const racer of racers) {
    const row = document.createElement('div');
    row.className = 'racer-row';
    const name = document.createElement('span');
    name.textContent = racer.playerId === state.playerId ? `${racer.displayName} (you)` : racer.displayName;
    const distance = document.createElement('span');
    distance.textContent = `${Math.floor(racer.distance).toLocaleString()} m`;
    row.append(name, distance);
    rows.push(row);
  }
  if (rows.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'racer-row';
    empty.textContent = state.roomCode ? 'Waiting for riders…' : 'Create or join a room to race friends.';
    rows.push(empty);
  }
  container.replaceChildren(...rows);
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Required game UI element #${id} is missing.`);
  }
  return element as T;
}
