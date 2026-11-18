# Trail Rush VR — Verification

## Baseline

- `npm run typecheck`: PASS before implementation.
- `npx @iwsdk/cli reference status`: PASS; local reference cache is ready.
- `npx @iwsdk/cli dev status`: Vite is running, but managed browser is not connected.
- `npx @iwsdk/cli scene capabilities --raw`: BLOCKED; Playwright headed browser cannot start because this sandbox has no X server (`Missing X server or $DISPLAY`). `xvfb-run` is not installed.

## Acceptance evidence

Implementation checks will be added here after code lands. The managed scene render/screenshot gate must remain explicitly blocked unless the environment can launch the editor browser; do not infer visual validity from typecheck or build alone.
