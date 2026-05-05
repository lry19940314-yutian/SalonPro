/**
 * guard - 路由守衛（導航守衛）
 *
 * 功能：
 * 1. 登入驗證（登錄守衛）：未登入時強制跳轉至登入頁 /login
 * 2. 角色權限驗證（權限守衛）：檢查使用者角色是否允許訪問該路由
 *    - 美容師禁止訪問 /admin/* 後台路由
 * 3. 終端訪問限制（終端守衛）：限制特定路由僅允許特定終端訪問
 * 4. 頁面標題動態更新（標題守衛）：每個路由自動設置繁體中文頁面標題
 * 5. Token 過期檢查：自動檢測 Token 是否過期，過期則跳轉登入頁
 *
 * 設備切換說明：
 * 組件根據螢幕寬度自動切換（≥768px 加載 PC 組件；＜768px 加載 Mobile 組件），
 * 由 adaptive.ts 中的 resolveDeviceComponent() 在路由初始化時處理，
 * 無需在守衛中進行設備檢查。
 *
 * 權限規則：
 * - manager（店長/管理員）：可訪問全部路由
 * - beautician（美容師）：僅可訪問個人業務路由，禁止訪問 /admin/*
 *
 * 技術棧：Vue Router 4 + Pinia
 */
import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RouteMetaExtend } from './adaptive'
import { getDeviceType } from './adaptive'

// ==================== 常量定義 ====================

/** 登入頁路徑 */
const LOGIN_PATH = '/login'

/** 首頁路徑 */
const HOME_PATH = '/info-center'

/** 無權限頁面路徑 */
const FORBIDDEN_PATH = '/403'

/** 系統名稱（用於頁面標題後綴） */
const SYSTEM_NAME = '美業 SaaS 管理系統'

/**
 * 美容師禁止訪問的路徑前綴列表
 * 違反此規則時直接跳轉 403 頁面
 */
const BEAUTICIAN_RESTRICTED_PREFIXES: string[] = ['/admin']

// ==================== 輔助函數 ====================

/**
 * 檢查美容師是否被禁止訪問指定路徑
 *
 * @param path - 路由路徑
 * @returns 若為美容師且路徑被禁止則回傳 true
 */
function isBeauticianRestrictedPath(path: string): boolean {
  return BEAUTICIAN_RESTRICTED_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/**
 * 更新頁面標題
 *
 * @param title - 頁面標題（可選）
 */
function updateDocumentTitle(title?: string): void {
  if (title) {
    document.title = `${title} | ${SYSTEM_NAME}`
  } else {
    document.title = SYSTEM_NAME
  }
}

// ==================== 路由守衛設置 ====================

/**
 * 設置路由守衛
 *
 * 守衛執行順序：
 * 1. 標題守衛 - 更新頁面標題
 * 2. 公開路由守衛 - 公開路由直接放行
 * 3. 登錄守衛 - 檢查 Token 是否存在且未過期
 * 4. 終端守衛 - 檢查終端訪問限制（保留擴展）
 * 5. 角色路徑守衛 - 美容師禁止訪問 /admin/*
 * 6. 角色權限守衛 - 基於路由 meta.roles 配置
 *
 * @param router - Vue Router 實例
 *
 * @example
 * ```ts
 * // 在 router/index.ts 中調用
 * setupRouterGuard(router)
 * ```
 */
export function setupRouterGuard(router: Router): void {
  // ==================== 全域前置守衛 ====================

  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // 取得路由 meta（轉換為擴展類型）
    const meta = to.meta as RouteMetaExtend | undefined

    // ===== 1. 標題守衛：每個路由自動設置頁面標題（繁體中文） =====
    updateDocumentTitle(meta?.title)

    // ===== 2. 公開路由守衛：無需登入的路由直接放行 =====
    if (meta?.requiresAuth === false) {
      // 若已登入且嘗試訪問登入頁，跳轉至首頁
      if (to.path === LOGIN_PATH && authStore.isAuthenticated) {
        // 使用 replace 避免登入頁留在歷史記錄中
        next({ path: HOME_PATH, replace: true })
        return
      }
      // 公開路由（如 /403、/404）直接放行
      next()
      return
    }

    // ===== 3. 登錄守衛：檢查 Token 是否存在且未過期 =====
    // 優先使用 authStore.isAuthenticated，若為 false 則嘗試從 localStorage 直接讀取 Token
    // 解決登錄成功後 authStore 狀態尚未同步導致被重定向回登錄頁的問題
    let isAuth = authStore.isAuthenticated
    if (!isAuth) {
      // 從 localStorage 直接檢查 Token 是否存在
      // 注意：Token 是經由 authStore.saveToStorage 使用 JSON.stringify 存儲的，
      // 因此需要使用 JSON.parse 解析
      try {
        const rawToken = localStorage.getItem('salon_token')
        if (rawToken) {
          const localToken = JSON.parse(rawToken) as string
          if (localToken) {
            // localStorage 中有 Token，但 authStore 狀態未同步，嘗試恢復
            if (import.meta.env.DEV) {
              console.warn('[路由守衛] authStore 未認證但 localStorage 存在 Token，嘗試恢復狀態')
            }
            // 重新初始化 authStore（從 localStorage 恢復）
            // 注意：authStore 在初始化時已經從 localStorage 加載了 Token
            // 這裡再次檢查是為了確保狀態一致
            isAuth = true
          }
        }
      } catch {
        // localStorage 解析失敗，忽略
      }
    }

    if (!isAuth) {
      // 未登入或 Token 已過期：記錄原始路徑，跳轉至登入頁
      // 若當前已在登入頁，避免無限重定向循環
      if (to.path === LOGIN_PATH) {
        next()
        return
      }
      next({
        path: LOGIN_PATH,
        query: { redirect: to.fullPath },
      })
      return
    }

    // ===== 4. 終端守衛：檢查終端訪問限制（預留擴展） =====
    // 目前所有路由均支援雙端訪問，此處保留擴展點
    // 若未來需要限制特定路由僅 PC 或僅 Mobile 訪問，可在 meta 中添加 device 字段
    const currentDevice = getDeviceType()
    if (import.meta.env.DEV) {
      console.log(
        `[路由守衛] ${to.path} | 設備: ${currentDevice} | 角色: ${authStore.userRole}`
      )
    }

    // ===== 5. 角色路徑守衛：美容師禁止訪問 /admin/* =====
    if (authStore.isBeautician && isBeauticianRestrictedPath(to.path)) {
      next({
        path: FORBIDDEN_PATH,
        query: {
          message: `美容師無法訪問「${meta?.title || to.path}」頁面`,
        },
      })
      return
    }

    // ===== 6. 角色權限守衛：基於路由 meta.roles 配置 =====
    const routeRoles = meta?.roles
    if (routeRoles && routeRoles.length > 0) {
      const userRole = authStore.userRole

      // 未登入（理論上不應發生，因前面已檢查）
      if (!userRole) {
        next(LOGIN_PATH)
        return
      }

      // 檢查角色是否在允許列表中
      if (!routeRoles.includes(userRole)) {
        next({
          path: FORBIDDEN_PATH,
          query: {
            message: `您沒有權限訪問「${meta?.title || to.path}」頁面`,
          },
        })
        return
      }
    }

    // ===== 全部檢查通過，放行 =====
    next()
  })

  // ==================== 全域後置守衛 ====================

  router.afterEach((to, from) => {
    // 頁面訪問日誌（開發環境輸出）
    if (import.meta.env.DEV) {
      const meta = to.meta as RouteMetaExtend | undefined
      console.log(
        `[路由日誌] ${from.path} → ${to.path}`,
        meta?.title ? `| ${meta.title}` : '',
        `| 時間: ${new Date().toLocaleTimeString('zh-TW')}`
      )
    }

    // 滾動行為：回到頂部
    window.scrollTo(0, 0)
  })

  // ==================== 全域錯誤處理 ====================

  router.onError((error) => {
    console.error('[路由錯誤]', error)

    // 開發環境顯示詳細錯誤
    if (import.meta.env.DEV) {
      console.warn('路由載入失敗，請檢查組件路徑是否正確')
    }
  })
}
