/**
 * main.ts - 應用程式入口
 *
 * 功能：
 * 1. 建立 Vue 應用實例
 * 2. 註冊 Pinia 狀態管理、Vue Router
 * 3. 註冊 Element Plus（PC 端）與 Vant（移動端）UI 庫
 * 4. 註冊全域共用組件
 * 5. 掛載應用程式至 DOM
 * 6. 修補 Vue Devtools 瀏覽器擴充功能的已知問題
 *
 * 技術棧：Vue 3 + Vite + TypeScript
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'

// ==================== Element Plus（PC 端 UI 庫）====================

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// ==================== Vant（移動端 UI 庫）====================

import Vant from 'vant'
import 'vant/lib/index.css'

// ==================== 全域共用組件 ====================

import { globalComponents } from './components/common'

/**
 * Devtools 錯誤關鍵字列表
 * 用於識別 Vue Devtools 瀏覽器擴充功能的已知通訊錯誤
 */
const DEVTOOLS_ERROR_KEYWORDS = [
  '__vrv_devtools',
  '__vue_devtools',
  '__vcc_devtools',
  'Could not establish connection',
  'Receiving end does not exist',
] as const

/**
 * 判斷錯誤訊息是否來自 Vue Devtools 擴充功能
 *
 * @param msg - 錯誤訊息字串
 * @returns 是否為 Devtools 相關錯誤
 */
function isDevtoolsError(msg: string): boolean {
  return DEVTOOLS_ERROR_KEYWORDS.some((keyword) => msg.includes(keyword))
}

/**
 * 修補 Vue Devtools 瀏覽器擴充功能的已知問題
 */
function patchVueDevtools(): void {
  // 確保掛載點元素存在，避免 Devtools 在 null 上設置屬性
  const appEl = document.getElementById('app')
  if (appEl) {
    // 預先初始化 Devtools 可能使用的內部屬性，避免後續設置失敗
    ;(appEl as any).__vue_app__ = null
  }

  // 捕獲 Devtools 相關的全域錯誤（同步/非同步錯誤）
  window.addEventListener('error', (event: ErrorEvent) => {
    const msg = event.message || ''
    if (isDevtoolsError(msg)) {
      event.preventDefault()
      if (import.meta.env.DEV) {
        console.warn('[Devtools] 已攔截 Vue Devtools 擴充功能錯誤:', msg)
      }
    }
  })

  // 捕獲未處理的 Promise 拒絕（Devtools 的非同步通訊錯誤）
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason
    const msg = reason?.message || String(reason) || ''
    if (isDevtoolsError(msg)) {
      event.preventDefault()
      if (import.meta.env.DEV) {
        console.warn('[Devtools] 已攔截 Vue Devtools Promise 錯誤:', msg)
      }
    }
  })
}

// ==================== 應用程式初始化 ====================

// 執行 Devtools 修補（必須在 createApp 之前）
patchVueDevtools()

// 建立 Vue 應用實例
const app = createApp(App)

// 註冊 Pinia 狀態管理
app.use(pinia)

// 註冊 Vue Router
app.use(router)

// 註冊 Element Plus（PC 端 UI 庫）
app.use(ElementPlus)

// 註冊 Vant（移動端 UI 庫）
app.use(Vant)

// 全域註冊 Element Plus 圖示
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 註冊全域共用組件
globalComponents.forEach((component) => {
  if (component.name) {
    app.component(component.name, component)
  }
})

// 掛載應用程式至 DOM
app.mount('#app')

// 開發環境輸出初始化完成訊息
if (import.meta.env.DEV) {
  console.log('[SalonPro] 應用程式初始化完成')
}
