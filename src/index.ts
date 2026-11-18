import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { CombatSystem } from './combat.js';
import { HandRideSystem } from './hand-ride.js';
import { mountLobbyUi } from './lobby-ui.js';
import { MultiplayerSession } from './multiplayer.js';
import { NetworkSystem } from './network-system.js';
import { PickupSystem } from './pickups.js';
import { RaceHudSystem } from './race-hud.js';
import { RaceState } from './race-state.js';
import { RaceWorldSystem } from './race-world.js';

const raceState = new RaceState();
const sceneContainer = document.getElementById('scene-container');

if (!sceneContainer) {
  throw new Error('The race scene container is missing.');
}

World.create(sceneContainer, projectOptions)
  .then((world) => {
    const multiplayer = new MultiplayerSession(raceState);
    world.globals.raceState = raceState;
    world.globals.multiplayer = multiplayer;
    world.addCleanup(mountLobbyUi(raceState, multiplayer, world));
    world.addCleanup(() => {
      void multiplayer.close();
    });

    world.registerSystem(HandRideSystem);
    world.registerSystem(RaceWorldSystem);
    world.registerSystem(PickupSystem);
    world.registerSystem(CombatSystem);
    world.registerSystem(NetworkSystem);
    world.registerSystem(RaceHudSystem);
  })
  .catch((error: unknown) => {
    console.error('[Trail Rush] Could not start the IWSDK world:', error);
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'The 3D race could not start. Check the runtime console for details.';
    }
  });
