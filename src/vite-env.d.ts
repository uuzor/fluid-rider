/// <reference types="vite/client" />
/// <reference types="@iwsdk/vite-plugin-dev/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_CONVEX_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
