/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_ENV: 'development' | 'production';
  readonly VITE_ENABLE_DEBUG: string;
  readonly VITE_ENABLE_MOCK_DATA: string;
  readonly VITE_ASSETS_MODE: 'hotlink' | 'local';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
