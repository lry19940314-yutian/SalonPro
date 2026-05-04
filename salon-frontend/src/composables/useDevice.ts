/**
 * useDevice - 設備類型檢測組合式函數
 *
 * 功能：
 * 1. 根據視窗寬度自動判斷設備類型（pc / mobile）雙端
 * 2. 平板設備（768px ~ 1024px）歸類為 pc，加載 PC 端頁面 + 響應式樣式
 * 3. 提供 X-Device-Type Header 值，供 API 請求使用
 * 4. 支援響應式斷點：mobile < 768px ≤ pc
 * 5. 提供同步檢測函數 getDeviceType()，供路由初始化等非元件環境使用
 * 6. 斷點常量與 adaptive.ts 中的 BREAKPOINTS 保持同步
 *
 * 技術棧：Vue 3 Composition API
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

// ==================== 類型定義 ====================

/** 設備類型枚舉（僅保留 PC / Mobile 雙端） */
export type DeviceType = 'pc' | 'mobile'

// ==================== 斷點常量 ====================

/**
 * 響應式斷點常量
 * 與 adaptive.ts 中的 BREAKPOINTS 保持同步
 * 與 SCSS 變數保持同步
 */
export const BREAKPOINTS = {
  /** 手機端最大寬度（小於此值為手機） */
  MOBILE_MAX: 767,
  /** PC 端最小寬度（含平板，大於等於此值為 PC） */
  DESKTOP_MIN: 768, // 平板（768~1024）歸類為 pc
} as const

// ==================== 全域響應式狀態 ====================

/** 當前設備類型（響應式，模組級別共享） */
const deviceType = ref<DeviceType>('pc')

/** 視窗寬度（響應式，模組級別共享） */
const windowWidth = ref<number>(
  typeof window !== 'undefined' ? window.innerWidth : 1024
)

// ==================== 設備解析 ====================

/**
 * 根據視窗寬度解析設備類型
 * 平板（768px ~ 1024px）歸類為 pc，僅區分 mobile / pc 雙端
 *
 * @param width - 視窗寬度（像素）
 * @returns 設備類型
 */
function resolveDeviceType(width: number): DeviceType {
  if (width <= BREAKPOINTS.MOBILE_MAX) return 'mobile'
  return 'pc'
}

/**
 * 同步檢測當前設備類型（無需依賴 Vue 生命週期）
 *
 * 此函數為純函數，可直接在路由初始化、main.ts 等
 * 非 Vue 元件環境中使用，不受 onMounted 限制。
 *
 * @returns 當前設備類型
 *
 * @example
 * ```ts
 * // 在 router/index.ts 中使用
 * import { getDeviceType } from '@/composables/useDevice'
 * const device = getDeviceType()
 * ```
 */
export function getDeviceType(): DeviceType {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024
  return resolveDeviceType(width)
}

// ==================== Resize 事件處理 ====================

/** 視窗 resize 事件處理函數 */
function handleResize(): void {
  const newWidth = window.innerWidth
  const newDeviceType = resolveDeviceType(newWidth)

  // 僅在設備類型真正改變時才更新，減少不必要的重新渲染
  if (newDeviceType !== deviceType.value) {
    windowWidth.value = newWidth
    deviceType.value = newDeviceType

    if (import.meta.env.DEV) {
      console.log(
        `[設備檢測] 設備切換: ${deviceType.value === 'pc' ? 'PC/平板' : '手機'} | 寬度: ${newWidth}px`
      )
    }
  } else {
    // 設備類型未變，僅更新寬度
    windowWidth.value = newWidth
  }
}

// ==================== Hook ====================

/**
 * 設備類型檢測 Hook
 *
 * @returns {Object} 設備類型相關狀態與方法
 *
 * @example
 * ```ts
 * const { deviceType, isMobile, isPC, deviceHeader } = useDevice()
 * ```
 */
export function useDevice() {
  /** 初始化設備類型 */
  deviceType.value = resolveDeviceType(windowWidth.value)

  /** 是否為手機端 */
  const isMobile = computed<boolean>(() => deviceType.value === 'mobile')

  /** 是否為 PC 端（含平板） */
  const isPC = computed<boolean>(() => deviceType.value === 'pc')

  /** API 請求頭 X-Device-Type 值 */
  const deviceHeader = computed<string>(() => deviceType.value)

  /** 註冊 resize 事件監聽 */
  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  /** 移除 resize 事件監聽 */
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return {
    /** 當前設備類型 */
    deviceType,
    /** 當前視窗寬度 */
    windowWidth,
    /** 是否為手機端 */
    isMobile,
    /** 是否為 PC 端（含平板） */
    isPC,
    /** API 請求頭值（'pc' | 'mobile'） */
    deviceHeader,
    /** 強制重新解析設備類型 */
    resolveDeviceType,
  }
}
