# Trail Rush VR

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![IWSDK](https://img.shields.io/badge/IWSDK-1.0.0-6f42c1.svg)](https://developers.meta.com/horizon/documentation/web/webxr-iwsdk-overview)
[![Framework: Vite](https://img.shields.io/badge/Framework-Vite-646cff.svg)](https://vite.dev/)

A seated, hand-tracked alpine bike-racing game built with Meta's [Immersive Web
SDK](https://developers.meta.com/horizon/documentation/web/webxr-iwsdk-overview)
(IWSDK 1.0.0). Ride in a desktop browser or enter an emulated or physical XR
session; deploy as a static Vite app on Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fuuzor%2Ffluid-rider)

## What's included

- **Alpine race course** — a looping first-person track, bike cockpit, collectible boost tokens, and rival riders.
- **Hand-tracked riding** — push the right hand forward to accelerate, pull the left hand back to brake, and shift both hands sideways to steer.
- **Arcade action** — collect boosts and fire pulses at nearby rivals; desktop preview buttons provide the same controls without a headset.
- **Multiplayer rooms** — create or join a six-character room code, race with up to eight riders, and follow live positions on the leaderboard. Multiplayer uses Convex; practice mode remains playable when it is not configured.
- **Manifest-first IWSDK setup** — `iwsdk.config.json` is the authority for the asset catalog, component catalog, XR mode, and world features.
- **XR emulation without a headset** — IWER lets any browser enter an emulated Quest 3 session on the dev server, including the v0 sandbox preview. See [XR emulation](#xr-emulation) for how it is gated.

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), choose **Start practice ride**, and use the on-screen controls. Select **Enter VR** to start an emulated immersive session. To race with friends, configure a Convex deployment and set `NEXT_PUBLIC_CONVEX_URL`; otherwise, room actions are unavailable and practice mode still works. The race world and gameplay systems live under `src/`, with reusable scene assets in `src/scene-assets/`.

`npm run dev` is the IWSDK managed dev server (`iwsdk dev restart --foreground`),
and the one script v0 starts on your behalf. It serves the app the way Vite does
and additionally hosts the MCP command bridge behind the scene editor and the
scene/ECS/XR tooling. There is no `--open`, so it does not launch the managed
browser on boot — the first MCP or CLI command starts it lazily.

A `predev` hook runs `scripts/setup-browser-deps.mjs` first. That script installs
the system libraries managed Chromium needs inside the Fedora-based v0 sandbox,
and exits immediately on every other platform.

Two companion scripts drive that server's lifecycle:

```bash
npm run dev:status
npm run dev:down
```

For plain Vite with none of the managed infrastructure — the mode `vercel dev`
expects — use the runtime-only script:

```bash
npm run dev:runtime   # vite
```

Run only one of the two at a time: `npm run dev:down` first if a managed server
already holds the port.

Optional one-time setup for the semantic code-reference MCP tools:

```sh
npm run reference:warmup
```

Before testing anything, typecheck. Type errors stop systems from initialising
without necessarily logging to the console:

```sh
npm run typecheck
```

## Project structure

```
iwsdk.config.json                 IWSDK assets, components, XR mode, and world features
index.html                        Lobby, desktop controls, race HUD, and XR entry point
src/
  index.ts                        World creation and gameplay system registration
  hand-ride.ts                    Hand tracking and riding controls
  race-world.ts                   Course, cockpit, and rival setup
  pickups.ts / combat.ts          Boost collection and pulse combat
  lobby-ui.ts / race-hud.ts       Lobby, desktop controls, and HUD
  multiplayer.ts / network-system.ts  Convex room sessions and rival synchronization
  race-state.ts / race-components.ts   Shared game state and ECS components
  assets.ts / scene-assets/       Shared asset manifest and procedural 3D assets
convex/
  schema.ts / race.ts             Realtime rooms, racers, and validated mutations
public/
  gltf/race-cyclist/model.glb     CC0 cyclist and bicycle model
  ui/race-hud.uikitml             Runtime-loaded spatial HUD
vercel.json                       Static Vite build and SPA routing
```

`iwsdk.config.json` remains the project authority. IWSDK systems assemble the
race world from manifest-backed assets; reusable geometry and materials live in
TypeScript scene assets.

## Developing in v0

Open the repository in [v0](https://v0.app/) and it runs in a Vercel Sandbox: a
real Node.js VM with a framework-aware dev server, a terminal and Claude Code
pre-installed. v0 detects Vite, starts `npm run dev` itself, and proxies the
result through a generated HTTPS hostname — a secure context, which is what
WebXR requires. That script starts the managed dev server rather than bare Vite;
it serves the app on the same port, and its `predev` hook prepares the sandbox
for the managed browser the agent tooling drives.

To open a new v0 chat against a copy, fork this repository and connect the fork. Agent guidance is already wired up: `AGENTS.md` at the root, path-scoped
detail in `src/AGENTS.md`, `public/ui/AGENTS.md` and `public/scenes/AGENTS.md`,
and skill procedures under `.claude/skills/` mirrored into `.agents/skills/`.

## Deploy on Vercel

The easiest way to deploy is to import the repository into
[Vercel](https://vercel.com/new), or run `vercel` from the project root.

`vercel.json` selects the Vite framework preset, builds to `dist/`, sends
`Permissions-Policy: xr-spatial-tracking=*` so WebXR is allowed, and rewrites
unmatched paths to `/index.html`. Static files under `public/` still win, because
Vercel checks the filesystem before applying rewrites.

WebXR requires a secure context. The deployed HTTPS URL and `http://localhost`
both qualify; a plain-HTTP LAN address does not. To test on a physical headset
against your dev machine, run `IWSDK_DEV_HTTPS=1 npm run dev` and accept the
self-signed certificate on the device.

To deploy under a subpath, set `VITE_BASE_PATH` at build time.

## XR emulation

IWER is not part of the app bundle by default — `@iwsdk/vite-plugin-dev` injects
it, and two separate gates decide whether it reaches the page. Both are set in
`iwsdk.config.json` under `dev.emulator`, which is the project authority for this;
the plugin rejects the same options passed to `iwsdkDev()` in `vite.config.ts`.

| Gate            | Default     | Effect of the default                                            |
| --------------- | ----------- | ---------------------------------------------------------------- |
| `injectOnBuild` | `false`     | `vite build` emits no emulator, so deploys have nothing to run   |
| `activation`    | `localhost` | the injected runtime stays inert on any non-localhost hostname   |

The default `activation` is the one that bites in practice: the dev server always
injects IWER, but a v0 preview is served from a generated `*.v0.build` hostname
(older sandboxes used `*.vusercontent.net`), so the runtime loads and then sits
inert. This template widens `activation` to cover the hostnames a preview
actually uses:

```jsonc
"dev": {
  "emulator": {
    "device": "metaQuest3",
    "activation": {
      "source": "^(localhost|127\\.0\\.0\\.1|.*\\.vercel\\.app|.*\\.vusercontent\\.net|.*\\.v0\\.build)$"
    }
  }
}
```

The pattern is matched against `location.hostname` alone — no scheme, port or
path — so each term is a bare host suffix. v0 has renamed its preview domain
before; if it happens again, add a term here rather than widening to `.*`.

A regex is an object here (`{ source, flags }`), not a `/.../` string. On a real
headset IWER steps aside regardless, via the default `userAgentException` of
`/OculusBrowser/`.

`injectOnBuild` is deliberately left at its default. Emulating a headset is a
development affordance, and injecting the runtime adds roughly 1 MB to the
production bundle — a cost every visitor pays, including on domains where
`activation` returns false. The consequence is that **a deployed build ships no
emulator**: `npm run dev` and the v0 sandbox get IWER, a `vercel deploy` does
not. Set `injectOnBuild: true` if you want deploys emulated too; the
`.vercel.app` term in `activation` is there for that case and is otherwise inert.

## Notes

- Import Three.js classes from `@iwsdk/core`, never from `three` — a direct
  `three` import creates a duplicate instance and subtle breakage.
- `@iwsdk/vite-plugin-dev` depends on Playwright, so the first `npm install` in a
  fresh sandbox downloads Chromium, and `predev` installs the system libraries it
  needs to launch. Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` to skip the download
  when you only need to build — CI does exactly that.
- `package-lock.json` is committed, so `npm ci` reproduces the dependency tree
  exactly. Regenerate it with `npm install` whenever you change `package.json`.

## Learn More

- [Immersive Web SDK documentation](https://developers.meta.com/horizon/documentation/web/webxr-iwsdk-overview)
- [`facebook/immersive-web-sdk`](https://github.com/facebook/immersive-web-sdk) —
  the upstream repository this template's agent guidance is synced from
- [v0 documentation](https://v0.app/docs)
- [Vite documentation](https://vite.dev/) and the
  [Vercel Vite preset](https://vercel.com/docs/frameworks/vite)
- [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for the
full text.

Note that IWSDK itself is MIT-licensed; this template's Apache-2.0 terms cover
the template's own source, not its dependencies.
