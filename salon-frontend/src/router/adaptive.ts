/**
 * adaptive - 雙端動態適配路由解析
 *
 * 功能：
 * 1. 定義 PC/Mobile 雙端路由配置類型（AdaptiveRouteConfig）
 * 2. 提供運行時根據螢幕寬度自動切換組件的解析器
 * 3. 螢幕 ≥768px 加載 PC 組件，＜768px 加載 Mobile 組件
 * 4. 平板設備（768px ~ 1024px）自動加載 PC 組件，透過響應式樣式適配
 * 5. 支援視窗 resize 時動態重新解析組件
 *
 * 路由配置規範：
 * - component: PC 端組件（螢幕 ≥768px 使用，含平板）
 * - mobileComponent: 手機端組件（螢幕 ＜768px 使用），可選
 * - 若未提供 mobileComponent，手機端自動降級使用 PC 組件
 *
 * 技術棧：Vue Router 4 + TypeScript
 */

import type { RouteRecordRaw, RouteMeta } from 'vue-router'
import type { UserRole } from '@/composables/usePermission'

// ==================== 斷點常量 ====================

/**
 * 響應式斷點常量
 * 與 useDevice.ts 中的 BREAKPOINTS 保持同步
 */
export const BREAKPOINTS = {
  /** 手機端最大寬度（小於此值為手機） */
  MOBILE_MAX: 767,
  /** PC 端最小寬度（含平板，大於等於此值為 PC） */
  DESKTOP_MIN: 768,
} as const

// ==================== 類型定義 ====================

/** 設備類型枚舉（僅 PC / Mobile 雙端） */
export type DeviceType = 'pc' | 'mobile'

/** 路由 meta 擴展介面 */
export interface RouteMetaExtend extends RouteMeta {
  /** 頁面標題（繁體中文） */
  title?: string
  /** 是否需要登入驗證（預設 true） */
  requiresAuth?: boolean
  /** 允許訪問的角色列表，空陣列表示公開 */
  roles?: UserRole[]
  /** 是否隱藏於側邊欄/底部導航 */
  hidden?: boolean
  /** 圖示名稱（Material Symbols 圖示名） */
  icon?: string
  /** 是否為快取頁面（keep-alive） */
  keepAlive?: boolean
}

/**
 * 雙端路由配置介面
 *
 * 標準寫法（PC 與 Mobile 使用不同組件）：
 * ```ts
 * {
 *   path: '/dashboard',
 *   name: 'Dashboard',
 *   component: () => import('@/views/dashboard/DashboardView.vue'),
 *   mobileComponent: () => import('@/views/dashboard/DashboardMobile.vue'),
 * }
 * ```
 *
 * 若 PC 與 Mobile 共用同一組件，可省略 mobileComponent：
 * ```ts
 * {
 *   path: '/login',
 *   name: 'Login',
 *   component: () => import('@/views/login/LoginView.vue'),
 * }
 * ```
 */
export interface AdaptiveRouteConfig extends Omit<RouteRecordRaw, 'component' | 'components' | 'children'> {
  /** PC 端組件（螢幕 ≥768px 使用，含平板） */
  component?: RouteRecordRaw['component']
  /** 手機端組件（螢幕 ＜768px 使用），可選；未提供時自動降級使用 component */
  mobileComponent?: RouteRecordRaw['component']
  /** 子路由（遞迴支援雙端配置） */
  children?: AdaptiveRouteConfig[]
  /** 路由 meta（擴展類型） */
  meta?: RouteMetaExtend
}

// ==================== 設備檢測 ====================

/**
 * 根據視窗寬度判斷當前設備類型
 * 平板（768px ~ 1024px）歸類為 pc，僅區分 mobile / pc 雙端
 *
 * @param width - 視窗寬度（預設使用 window.innerWidth）
 * @returns 設備類型
 *
 * @example
 * ```ts
 * const device = getDeviceType() // 'pc' | 'mobile'
 * ```
 */
export function getDeviceType(width?: number): DeviceType {
  const w = width ?? (typeof window !== 'undefined' ? window.innerWidth : 1024)
  return w <= BREAKPOINTS.MOBILE_MAX ? 'mobile' : 'pc'
}

// ==================== 組件解析 ====================

/**
 * 根據螢幕寬度解析當前應使用的設備組件
 *
 * 解析規則：
 * 1. 手機端（＜768px）：優先使用 mobileComponent，若無則降級使用 component
 * 2. PC 端（≥768px，含平板）：使用 component
 *
 * @param routeConfig - 雙端路由配置
 * @returns 對應的組件載入函數
 *
 * @example
 * ```ts
 * const loader = resolveDeviceComponent(route)
 * // 螢幕 ≥768px → 回傳 component（PC 組件）
 * // 螢幕 ＜768px → 回傳 mobileComponent（若無則降級為 component）
 * ```
 */
export function resolveDeviceComponent(
  routeConfig: AdaptiveRouteConfig
): RouteRecordRaw['component'] {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024
  const isMobile = width <= BREAKPOINTS.MOBILE_MAX

  // 手機端：優先使用 mobileComponent，若無則降級使用 PC 組件
  if (isMobile) {
    return routeConfig.mobileComponent ?? routeConfig.component
  }

  // PC 端（含平板）：優先使用 PC 組件，若無則降級使用 mobileComponent
  return routeConfig.component ?? routeConfig.mobileComponent
}

// ==================== 路由轉換 ====================

/**
 * 將雙端路由配置轉換為標準 Vue Router 路由配置
 * 根據當前螢幕寬度遞迴解析所有層級的對應端組件
 *
 * 轉換流程：
 * 1. 遍歷所有路由配置
 * 2. 對每個路由調用 resolveDeviceComponent 解析對應端組件
 * 3. 遞迴處理子路由
 * 4. 返回標準 RouteRecordRaw 陣列
 *
 * @param routes - 雙端路由配置陣列
 * @returns 標準路由配置陣列（RouteRecordRaw[]）
 *
 * @example
 * ```ts
 * const standardRoutes = transformRoutes(adaptiveRoutes)
 * const router = createRouter({ routes: standardRoutes, ... })
 * ```
 */
export function transformRoutes(
  routes: AdaptiveRouteConfig[]
): RouteRecordRaw[] {
  return routes.map((route) => {
    const { mobileComponent, children, ...rest } = route

    // 根據螢幕寬度解析對應端組件
    const resolvedComponent = resolveDeviceComponent(route)

    // 遞迴處理子路由（支援多層嵌套）
    const resolvedChildren = children
      ? transformRoutes(children)
      : undefined

    return {
      ...rest,
      component: resolvedComponent,
      children: resolvedChildren,
    } as RouteRecordRaw
  })
}
