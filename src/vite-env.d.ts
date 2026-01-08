/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly IS_TEST: boolean;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

