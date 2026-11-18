# Trail Rush VR — Tech Plan

## Configuration

- Keep IWSDK as the runtime; `virtual:iwsdk-project` remains the sole `World.create()` options source.
- VR mode with `handTracking: true`, grabbing enabled for pinch pickups, and locomotion disabled. Use a stable seated viewpoint; physics is off because movement is an arcade simulation.
- Use root-level `DomeGradient`/`IBLGradient` only for environment lighting.

## Asset decision

Use 3DAssets.dev’s `Cyclist On Bicycle (Pixel Modern City Street)` (`29064`), returned by its public catalog API. The listing declares CC0 1.0, no attribution required, and provides a self-contained GLB v2 with 244 triangles, one embedded WebP texture, a 0.78 × 1.96 × 1.78 m bound, and no animations. Its 18,904-byte GLB was fetched and verified locally. This standard GLB is loaded through IWSDK’s manifest `AssetType.GLTF` path (the installed IWSDK glTF pipeline uses Three.js GLTFLoader); the compact voxel look also aligns with the assumed arcade art direction. The file is stored in `public/gltf/race-cyclist/model.glb`; no third-party runtime URL is needed.

## Mechanics grounding

| Mechanic | Class | IWSDK surface | Custom work |
|---|---|---|---|
| Hand tracking | CONFIGURE + CUSTOM | `world.xr.features.handTracking`; `this.player.indexTipSpaces`; `InputComponent.Trigger` for hand pinch | Read joint-space motion; calibrate neutral hand positions; map to throttle, brake, and steering. |
| Seated ride | CUSTOM | Persistent `world.player`; locomotion disabled | Keep view stable; move track/pickups/rivals relative to rider. |
| Grab boost | BUILT-IN + CUSTOM | `OneHandGrabbable`, `RayInteractable`, grabbing feature; enable `GrabSystem.useHandPinchForGrab` after confirming installed API | Boost pickup state, collection and respawn. |
| Shoot rival | CUSTOM | XR hand pinch surfaced through gamepad trigger | Cooldown, nearest-target check, hit event and feedback; Convex validates rate and target. |
| Scenic terrain | CUSTOM asset | Parentless Object3D prototypes in `src/scene-assets/`, registered in `src/assets.ts` | Deterministic terrain/track, distant mountains, trees, track markers. |
| Multiplayer | CUSTOM | Connected Convex backend | Rooms, guest racers, reactive roster and bounded update/attack mutations. |
| HUD/lobby | CONFIGURE + CUSTOM | UIKitML asset and scene node for immersive HUD; semantic DOM lobby for Preview/room entry | Bind room, speed, score, boost, and leaderboard to runtime. |

## Custom systems and responsibilities

- `HandRideSystem` (priority 10): reuses typed Vector3 scratch values, calibrates both `indexTipSpaces`, calculates throttle/brake/steering from local hand displacement, and reads trigger pinches for attack/collect intents. No per-frame allocations.
- `RaceWorldSystem` (priority 15): advances speed/distance, wraps course segments, moves pickups/riders, and applies arcade boost.
- `PickupSystem` (priority 18): queries tagged pickup entities and collects only when hand proximity + pinch or built-in grab is observed.
- `CombatSystem` (priority 20): rate-limits local fire, finds a nearby rival using queries, requests a bounded hit mutation, and plays visible feedback.
- `MultiplayerSystem` (priority 30): owns one Convex client session, subscribes to room roster, sends compact state at a capped cadence (4 Hz), and unsubscribes on teardown.
- `HudSystem` (priority 35): updates UIKitML and DOM fields only when values change; uses query snapshots and signals for shared state.

## Data model and safety

- `rooms`: indexed by normalized room code.
- `racers`: indexed by room code and by `{ roomCode, playerId }`; store opaque random guest id, sanitized display name, lane, distance, speed, score, boost, and `lastSeen`.
- `attacks`: short-lived hit events or a target stun deadline; only the shooter’s valid room member can report a hit. Validate finite, bounded numbers, names, room codes, and per-player cooldowns server-side.
- No user accounts or personal data. Client-generated `crypto.randomUUID()` is a session identifier, not authentication. Room codes are unguessable enough for casual rooms but do not protect sensitive data.
- Vite exposes only the explicitly public `NEXT_PUBLIC_CONVEX_URL` prefix to the client; deploy keys never reach browser code.

## Verification risks

- Scene capability/render tools are blocked because the managed editor browser has no X server. Use static schema/build checks and the running Preview; report scene-authoring evidence as blocked rather than inferred.
- Convex environment URL is injected by the connected v0 integration per its skill; if the Vite Preview proves it absent, keep Practice mode available and report multiplayer as blocked rather than silently mocking it.
- Imported GLB orientation and hand gesture thresholds require browser visual calibration; the final review must verify player spawn clearance and that the hand pointer spaces track as expected.
