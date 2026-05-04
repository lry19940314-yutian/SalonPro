/**
 * index - Vue Router 4 路由實例
 *
 * 功能：
 * 1. 建立 Vue Router 4 實例
 * 2. 整合路由表（routes.ts）
 * 3. 整合路由守衛（guard.ts）
 * 4. 根據螢幕寬度自動解析 PC/Mobile 雙端組件
 * 5. 支援視窗 resize 時動態重新解析路由組件
 *
 * 組件切換邏輯：
 * - 螢幕 ≥768px → 加載 PC 組件（component），含平板響應式
 * - 螢幕 ＜768px → 加載 Mobile 組件（mobileComponent），若無則降級 PC 組件
 *
 * 技術棧：Vue Router 4 + TypeScript
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { Router } from 'vue-router'
import routes from './routes'
import { setupRouterGuard } from './guard'
import { transformRoutes } from './adaptive'
import type { AdaptiveRouteConfig } from './adaptive'

/** 路由實例引用（供外部訪問） */
let routerInstance: Router | null = null

/**
 * 建立並配置 Vue Router 實例
 *
 * 流程：
 * 1. 根據當前螢幕寬度轉換雙端路由（解析對應端組件）
 * 2. 建立 Router 實例
 * 3. 設置路由守衛
 *
 * @returns 配置完成的 Router 實例
 *
 * @example
 * ```ts
 * // main.ts 中使用
 * const router = createAppRouter()
 * app.use(router)
 * ```
 */
export function createAppRouter(): Router {
  // 根據螢幕寬度轉換雙端路由（解析對應端組件）
  const resolvedRoutes = transformRoutes(routes as AdaptiveRouteConfig[])

  // 建立 Router 實例
  const router = createRouter({
    // 使用 HTML5 History 模式
    history: createWebHistory(import.meta.env.BASE_URL),

    // 路由表（已根據螢幕寬度解析對應端組件）
    routes: resolvedRoutes,

    // 滾動行為：切換路由時回到頂部
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        // 使用瀏覽器前進/後退時，恢復滾動位置
        return savedPosition
      }
      if (to.hash) {
        // 有錨點時滾動到錨點
        return { el: to.hash, behavior: 'smooth' }
      }
      // 預設回到頂部
      return { top: 0, behavior: 'smooth' }
    },
  })

  // 設置路由守衛（登入驗證 + 權限檢查）
  setupRouterGuard(router)

  // 保存路由實例引用
  routerInstance = router

  return router
}

/**
 * 獲取當前路由實例
 *
 * @returns Router 實例或 null（尚未初始化）
 *
 * @example
 * ```ts
 * const router = getRouterInstance()
 * if (router) { router.push('/dashboard') }
 * ```
 */
export function getRouterInstance(): Router | null {
  return routerInstance
}

/**
 * 預設匯出 Router 實例（供 main.ts 直接使用）
 *
 * 注意：若需要動態根據螢幕寬度重新解析路由，
 * 請使用 createAppRouter() 工廠函數
 */
const router = createAppRouter()
export default router
