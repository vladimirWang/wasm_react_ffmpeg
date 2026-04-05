/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** 部署到测试环境时可设为 test，与 MODE 无关 */
  readonly VITE_APP_ENV?: string;
  // 可以在这里添加其他环境变量
  // readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
