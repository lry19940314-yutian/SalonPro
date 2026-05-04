/**
 * main.ts - 應用程式入口文件
 *
 * 功能：
 * 1. 建立 Vue 應用實例
 * 2. 註冊 Pinia 狀態管理
 * 3. 註冊 Vue Router
 * 4. 根據設備類型動態註冊 UI 組件庫（Element Plus / Vant）
 * 5. 掛載應用
 *
 * UI 組件庫註冊規則：
 * - PC 端（≥768px，含平板）：註冊 Element Plus
 * - 手機端（＜768px）：註冊 Vant
 *
 * 技術棧：Vue 3 + Pinia + Vue Router 4 + Element Plus + Vant
 */

import { createApp } from 'vue'
import pinia from '@/stores'
import router from '@/router'
import App from '@/App.vue'

// ==================== 建立 Vue 應用實例 ====================

const app = createApp(App)

// ==================== 註冊核心插件 ====================

// Pinia 狀態管理
app.use(pinia)

// Vue Router
app.use(router)

// ==================== 動態註冊 UI 組件庫 ====================

/**
 * 根據設備類型動態註冊對應的 UI 組件庫
 *
 * 注意：此處使用動態 import 實現按需載入，
 * 避免在手機端加載 Element Plus 或在 PC 端加載 Vant
 *
 * 平板設備（768px ~ 1024px）使用 Element Plus（與 PC 一致）
 * 與 useDevice.ts 中的 BREAKPOINTS 斷點邏輯保持一致
 */
async function registerUIComponents(): Promise<void> {
  const deviceType = detectDeviceType()

  if (deviceType === 'mobile') {
    // 手機端：註冊 Vant
    const Vant = await import('vant')
    app.use(Vant.default || Vant)

    // 引入 Vant 全域樣式
    await import('vant/lib/index.css')

    if (import.meta.env.DEV) {
      console.log('[UI組件] 手機端模式 → 已註冊 Vant')
    }
  } else {
    // PC / 平板端：註冊 Element Plus
    const ElementPlus = await import('element-plus')
    app.use(ElementPlus.default || ElementPlus)

    // 引入 Element Plus 全域樣式
    await import('element-plus/dist/index.css')

    if (import.meta.env.DEV) {
      console.log('[UI組件] PC/平板模式 → 已註冊 Element Plus')
    }
  }
}

/**
 * 檢測設備類型（用於 UI 組件庫註冊）
 *
 * 與 useDevice 邏輯一致，但此處為獨立函數避免循環依賴
 * 平板（768px 以上）歸類為 pc
 *
 * @returns 'pc' | 'mobile'
 */
function detectDeviceType(): 'pc' | 'mobile' {
  const width = window.innerWidth
  // 與 BREAKPOINTS.MOBILE_MAX = 767 保持一致
  if (width <= 767) return 'mobile'
  return 'pc'
}

// ==================== 掛載應用 ====================

/**
 * 啟動應用
 *
 * 流程：
 * 1. 先註冊 UI 組件庫（確保首次渲染時組件可用）
 * 2. 掛載應用至 #app
 * 3. 若啟動失敗，顯示降級錯誤提示
 */
async function bootstrap(): Promise<void> {
  try {
    // 註冊 UI 組件庫
    await registerUIComponents()

    // 掛載應用
    app.mount('#app')

    if (import.meta.env.DEV) {
      console.log(`[SalonPro] 應用啟動成功 | 環境: ${import.meta.env.VITE_APP_ENV}`)
    }
  } catch (error) {
    console.error('[SalonPro] 應用啟動失敗:', error)

    // 顯示降級提示（無需 Vue 即可渲染的純 HTML）
    const appEl = document.getElementById('app')
    if (appEl) {
      appEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;font-family:sans-serif;">
          <h1 style="color:#ac235a;">系統載入失敗</h1>
          <p style="color:#574146;">請重新整理頁面或聯繫系統管理員</p>
          <button onclick="location.reload()" style="padding:8px 24px;cursor:pointer;background:#ac235a;color:#fff;border:none;border-radius:8px;font-size:16px;">重新整理</button>
        </div>
      `
    }
  }
}

// 啟動應用
bootstrap()
