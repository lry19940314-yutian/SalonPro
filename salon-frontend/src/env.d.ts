/**
 * env.d.ts - 類型聲明檔案
 *
 * 提供 Vue 單文件組件（.vue）、ImportMeta 等類型支援
 */

/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/** 環境變數類型定義 */
interface ImportMetaEnv {
  /** 應用程式標題 */
  readonly VITE_APP_TITLE: string
  /** API 基礎 URL */
  readonly VITE_API_BASE_URL: string
  /** 當前環境 */
  readonly VITE_APP_ENV: 'development' | 'production' | 'test'
  /** 是否為開發環境（Vite 內建） */
  readonly DEV: boolean
  /** 是否為生產環境（Vite 內建） */
  readonly PROD: boolean
  /** 基礎路徑（Vite 內建） */
  readonly BASE_URL: string
}

/** Vite 注入的 ImportMeta 擴展 */
interface ImportMeta {
  readonly env: ImportMetaEnv
}
