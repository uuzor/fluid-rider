# Trail Rush VR — Architecture

## Existing-app delta

Use the existing IWSDK Vite project; do not scaffold another app. Preserve `virtual:iwsdk-project`, the current component manifest, and package versions. Convex is already a dependency and connected integration. Keep `public/scenes/main.iwsdk.scene.json` as the runtime scene authority.

## Files

- `src/components/race-components.ts`: system-free component declarations for racer, pickup, projectile, and terrain tile; exported through `src/components.ts`.
- `src/scene-assets/race-track.scene-asset.ts`: deterministic, parentless terrain/track prototype; use `@iwsdk/core` for Three.js classes.
- `src/assets.ts`: add local CC0 cyclist GLB and procedural race asset entries.
- `public/scenes/main.iwsdk.scene.json`: flat scene composition, root environment, static track, and HUD node.
- `public/ui/race-hud.uikitml`: readable in-world race HUD.
- `src/hand-ride.ts`, `src/race-world.ts`, `src/pickups.ts`, `src/combat.ts`, `src/multiplayer.ts`, `src/race-hud.ts`: one system per behavior.
- `convex/schema.ts`, `convex/race.ts`: indexed room/racer schema and validated public functions; never author `convex/_generated/`.
- `src/room-client.ts`, `src/lobby.ts`: browser-facing room orchestration and accessible create/join UI.
- `src/index.ts`: initialize globals and register systems in explicit priority order.
- `vite.config.ts` and `src/vite-env.d.ts`: expose only the public Convex URL variable to Vite client code.

## Milestones

1. M0: typecheck baseline — passed; managed browser unavailable.
2. M1: add and register verified CC0 rider GLB plus cohesive procedural alpine course.
3. M2: implement seated hand input, speed/brake, steering, pickups, combat and HUD.
4. M3: add Convex room membership, live position updates and validated combat events.
5. M4: run `npm run typecheck`, `npm run build`, and browser Preview checks; retry managed scene checks only if the environment gains a display.

Each milestone must leave the player origin clear, avoid frame-loop allocations, and use query-backed entity discovery.
