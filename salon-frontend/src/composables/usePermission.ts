/**
 * usePermission - 權限檢查組合式函數
 *
 * 功能：
 * 1. 檢查當前使用者是否具備指定路由的訪問權限
 * 2. 根據角色（manager / beautician）判斷可訪問路由
 * 3. 提供路由守衛所需的權限驗證方法
 * 4. 提供菜單過濾功能（根據角色動態顯示/隱藏菜單項）
 *
 * 權限規則：
 * - manager（店長/管理員）：可訪問全部路由
 * - beautician（美容師）：僅可訪問個人業務路由，禁止訪問 /admin/* 後台路由
 *
 * 技術棧：Vue 3 Composition API + Pinia
 */

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

// ==================== 類型定義 ====================

/** 角色類型枚舉 */
export type UserRole = 'manager' | 'beautician'

/** 角色顯示名稱對應表 */
export const ROLE_LABELS: Record<UserRole, string> = {
  manager: '店長 / 管理員',
  beautician: '美容師',
}

/**
 * 路由權限配置介面
 */
export interface RoutePermission {
  /** 允許訪問的角色列表，空陣列表示公開 */
  roles?: UserRole[]
  /** 是否需要登入驗證 */
  requiresAuth?: boolean
}

/**
 * 菜單項配置介面
 */
export interface MenuItem {
  /** 路由路徑 */
  path: string
  /** 顯示名稱 */
  name: string
  /** 圖示名稱（Material Symbols） */
  icon: string
  /** 允許訪問的角色列表 */
  roles: UserRole[]
}

// ==================== 常量 ====================

/**
 * 美容師禁止訪問的路徑前綴列表
 * 與 guard.ts 中的 BEAUTICIAN_RESTRICTED_PREFIXES 保持同步
 */
const BEAUTICIAN_RESTRICTED_PREFIXES: string[] = ['/admin']

// ==================== Hook ====================

/**
 * 權限檢查 Hook
 *
 * @returns {Object} 權限相關狀態與方法
 *
 * @example
 * ```ts
 * const { isManager, isBeautician, canAccess } = usePermission()
 * canAccess(['manager']) // true（店長可訪問）
 * canAccessPath('/admin/dashboard') // false（美容師無法訪問）
 * ```
 */
export function usePermission() {
  const authStore = useAuthStore()

  /** 當前使用者角色 */
  const currentRole = computed<UserRole | null>(() => authStore.userRole)

  /** 是否已登入 */
  const isAuthenticated = computed<boolean>(() => authStore.isAuthenticated)

  /** 是否為店長/管理員 */
  const isManager = computed<boolean>(() => currentRole.value === 'manager')

  /** 是否為美容師 */
  const isBeautician = computed<boolean>(() => currentRole.value === 'beautician')

  /** 角色顯示名稱 */
  const roleLabel = computed<string>(() => {
    if (!currentRole.value) return ''
    return ROLE_LABELS[currentRole.value]
  })

  /**
   * 檢查當前角色是否可訪問指定路由（基於角色列表）
   *
   * @param routeRoles - 路由允許的角色列表
   * @returns 是否可訪問
   *
   * @example
   * ```ts
   * canAccess(['manager']) // 僅店長可訪問
   * canAccess(['manager', 'beautician']) // 兩者皆可
   * canAccess([]) // 公開路由，所有人可訪問
   * canAccess() // 未定義角色，所有人可訪問
   * ```
   */
  function canAccess(routeRoles?: UserRole[]): boolean {
    // 公開路由（未指定角色或空陣列）：所有人都可訪問
    if (!routeRoles || routeRoles.length === 0) return true

    // 未登入且路由需要特定角色：拒絕訪問
    if (!currentRole.value) return false

    // 檢查當前角色是否在允許列表中
    return routeRoles.includes(currentRole.value)
  }

  /**
   * 檢查指定路由路徑是否對美容師開放
   * 美容師禁止訪問 /admin/* 路徑
   *
   * @param path - 路由路徑
   * @returns 是否允許訪問
   *
   * @example
   * ```ts
   * canAccessPath('/admin/dashboard') // false（美容師無法訪問）
   * canAccessPath('/dashboard') // true
   * ```
   */
  function canAccessPath(path: string): boolean {
    if (!currentRole.value) return false

    // 美容師禁止訪問管理後台路由
    if (isBeautician.value) {
      return !BEAUTICIAN_RESTRICTED_PREFIXES.some((prefix) =>
        path.startsWith(prefix)
      )
    }

    return true
  }

  /**
   * 過濾菜單項（根據當前角色顯示可訪問的菜單）
   *
   * @param items - 菜單項陣列
   * @returns 過濾後的可訪問菜單項
   *
   * @example
   * ```ts
   * const menus = filterMenus(allMenuItems)
   * // 美容師：僅看到 beautician 角色的菜單
   * // 店長：看到所有菜單
   * ```
   */
  function filterMenus(items: MenuItem[]): MenuItem[] {
    return items.filter((item) => {
      return canAccess(item.roles) && canAccessPath(item.path)
    })
  }

  /**
   * 獲取當前角色可訪問的路由列表（過濾不可訪問路由）
   *
   * @param routes - 路由配置陣列
   * @returns 過濾後的可訪問路由
   *
   * @deprecated 請使用 filterMenus 替代（更明確的菜單過濾語義）
   */
  function filterAccessibleRoutes(
    routes: { path: string; roles?: UserRole[] }[]
  ): { path: string; roles?: UserRole[] }[] {
    return routes.filter((route) => {
      return canAccess(route.roles) && canAccessPath(route.path)
    })
  }

  return {
    /** 當前使用者角色 */
    currentRole,
    /** 是否已登入 */
    isAuthenticated,
    /** 是否為店長/管理員 */
    isManager,
    /** 是否為美容師 */
    isBeautician,
    /** 角色顯示名稱（如「店長 / 管理員」、「美容師」） */
    roleLabel,
    /** 檢查角色權限 */
    canAccess,
    /** 檢查路徑權限 */
    canAccessPath,
    /** 過濾菜單項（根據角色） */
    filterMenus,
    /** 過濾可訪問路由 */
    filterAccessibleRoutes,
  }
}
