# Trail Rush VR — Game Spec

## Pitch

A seated, hand-tracked arcade bicycle race through a bright alpine trail. Players steer by moving their hands, accelerate and brake with forward/back hand motion, grab glowing boost tokens, and pinch to fire short-range energy shots at racers in the same Convex room.

## Pillars

1. Comfortable seated play with no artificial walking or forced camera translation.
2. Legible hand controls that work without controllers in Quest hand-tracking mode.
3. Scenic, readable low-poly terrain with clear track edges and high-contrast pickups.
4. Multiplayer as a shared room and live leaderboard, with rate-limited state sync.

## Core loop

Join or create a room → sit comfortably and calibrate both hands → ride the looped trail → steer around scenery → reach for boost tokens → pinch to fire at a nearby rival → compare distance, score, and boost on the live leaderboard.

## Mechanics

- Seated ride: camera remains at the headset pose; course, pickups, and rivals move relative to the rider.
- Right hand pushed forward from a comfortable baseline increases throttle; left hand pulled toward the torso increases braking; lateral hand movement steers.
- A short pinch with the left hand fires a cooldown-limited shot. A shot only affects a nearby rival in the shared room.
- Reaching and pinching a nearby boost token collects it; a collected token grants a short acceleration burst.
- Multiplayer: room code, guest display name, live roster, distance/speed/score/boost state, and opponent hit feedback.
- Desktop Preview fallback: keyboard and pointer controls solely for testing when XR hands are unavailable. Quest gameplay remains hand-first.

## Platform and comfort

- Meta Quest WebXR via IWSDK; VR mode, hand tracking enabled.
- Seated position; no locomotion, camera shake, snap turns, or forced rotation.
- Stable horizon and modest visual acceleration; speed is communicated primarily by scenery flow, audio, and HUD.
- Browser Preview remains usable without an XR headset.

## Art direction

[ASSUMED] Retro-arcade voxel / low-poly alpine trail, chosen to match the selected CC0 cyclist model. Deep evergreen, alpine blue, warm stone, and bright amber/lime pickups. Keep landmarks large and sparse so the course reads at VR frame rates.

## Scope

- MVP: single-player loop, hand-drive controls, local boost pickups and firing feedback, room create/join, live Convex racer roster and leaderboard, accessible desktop Preview controls.
- Stretch: multi-track selection, persistent rankings, voice chat, advanced bike rig animation, and authoritative server simulation.

## Non-goals

- Standing play, controller-dependent input, realistic crash physics, public matchmaking, accounts, or voice chat.
- Server-authoritative physics; the backend synchronizes bounded race state and validates action cooldowns.

## Observable success criteria

1. The default scene shows a readable trail, player bike/cockpit, scenery, pickup, and rider model.
2. In XR, moving the right hand forward raises speed; pulling the left hand back lowers it; lateral hand movement steers.
3. A reachable boost token can be pinched/collected and increments boost state.
4. A left-hand pinch fires once per cooldown and can register a hit on a nearby opponent.
5. Two browsers in one room see each other’s name, distance, score, and hit/boost updates.
6. All controls are understandable in the HUD and no locomotion is required.
