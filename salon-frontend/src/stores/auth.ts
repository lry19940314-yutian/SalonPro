/**
 * authStore - 認證狀態管理（Pinia Store）
 *
 * 功能：
 * 1. 管理使用者登入/登出狀態
 * 2. 儲存 JWT Token、使用者資訊、角色權限
 * 3. 提供登入、登出、Token 刷新等方法
 * 4. 與 localStorage 同步，支援頁面刷新後狀態恢復
 *
 * 技術棧：Pinia + Vue 3 Composition API
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserRole } from '@/composables/usePermission'

/** 使用者資訊介面 */
export interface UserInfo {
  /** 員工 ID */
  id: number
  /** 姓名 */
  name: string
  /** 角色：manager（店長）| beautician（美容師） */
  role: UserRole
  /** 所屬門店 ID */
  shopId: number
  /** 頭像 URL */
  avatar: string
  /** 手機號碼 */
  phone?: string
  /** 職稱 */
  title?: string
}

/** 認證狀態介面 */
interface AuthState {
  /** JWT Access Token */
  token: string | null
  /** Refresh Token */
  refreshToken: string | null
  /** Token 過期時間戳（秒） */
  expiresIn: number | null
  /** 使用者資訊 */
  user: UserInfo | null
}

/** localStorage 鍵名常量 */
const STORAGE_KEYS = {
  TOKEN: 'salon_token',
  REFRESH_TOKEN: 'salon_refresh_token',
  USER_INFO: 'salon_user_info',
} as const

/**
 * 認證狀態 Store
 *
 * @example
 * ```ts
 * const authStore = useAuthStore()
 * authStore.login({ token: '...', user: { ... } })
 * authStore.logout()
 * ```
 */
export const useAuthStore = defineStore('auth', () => {
  // ========== 狀態 ==========

  /** JWT Access Token */
  const token = ref<string | null>(loadFromStorage<string>(STORAGE_KEYS.TOKEN))

  /** Refresh Token */
  const refreshToken = ref<string | null>(
    loadFromStorage<string>(STORAGE_KEYS.REFRESH_TOKEN)
  )

  /** Token 過期時間戳（秒） */
  const expiresIn = ref<number | null>(null)

  /** 使用者資訊 */
  const user = ref<UserInfo | null>(loadFromStorage<UserInfo>(STORAGE_KEYS.USER_INFO))

  // ========== Getter ==========

  /** 是否已登入（Token 存在且未過期） */
  const isAuthenticated = computed<boolean>(() => {
    if (!token.value) return false
    if (expiresIn.value) {
      const now = Math.floor(Date.now() / 1000)
      if (now >= expiresIn.value) return false
    }
    return true
  })

  /** 使用者角色 */
  const userRole = computed<UserRole | null>(() => {
    return user.value?.role ?? null
  })

  /** 使用者名稱 */
  const userName = computed<string>(() => {
    return user.value?.name ?? ''
  })

  /** 使用者 ID */
  const userId = computed<number | null>(() => {
    return user.value?.id ?? null
  })

  /** 所屬門店 ID */
  const shopId = computed<number | null>(() => {
    return user.value?.shopId ?? null
  })

  /** 是否為店長/管理員 */
  const isManager = computed<boolean>(() => userRole.value === 'manager')

  /** 是否為美容師 */
  const isBeautician = computed<boolean>(() => userRole.value === 'beautician')

  // ========== Actions ==========

  /**
   * 登入：儲存 Token 與使用者資訊
   *
   * @param authState - 認證狀態資料
   */
  function login(authState: AuthState): void {
    token.value = authState.token
    refreshToken.value = authState.refreshToken
    expiresIn.value = authState.expiresIn
    user.value = authState.user

    // 同步到 localStorage
    saveToStorage(STORAGE_KEYS.TOKEN, authState.token)
    saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, authState.refreshToken)
    saveToStorage(STORAGE_KEYS.USER_INFO, authState.user)
  }

  /**
   * 登出：清除所有認證狀態
   */
  function logout(): void {
    token.value = null
    refreshToken.value = null
    expiresIn.value = null
    user.value = null

    // 清除 localStorage
    clearStorage()
  }

  /**
   * 更新 Token（Token 刷新後調用）
   *
   * @param newToken - 新的 Access Token
   * @param newRefreshToken - 新的 Refresh Token
   * @param newExpiresIn - 新的過期時間戳
   */
  function updateToken(
    newToken: string,
    newRefreshToken: string,
    newExpiresIn: number
  ): void {
    token.value = newToken
    refreshToken.value = newRefreshToken
    expiresIn.value = newExpiresIn

    saveToStorage(STORAGE_KEYS.TOKEN, newToken)
    saveToStorage(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken)
  }

  /**
   * 更新使用者資訊
   *
   * @param userInfo - 新的使用者資訊
   */
  function updateUser(userInfo: Partial<UserInfo>): void {
    if (user.value) {
      user.value = { ...user.value, ...userInfo }
    } else {
      user.value = userInfo as UserInfo
    }
    saveToStorage(STORAGE_KEYS.USER_INFO, user.value)
  }

  // ========== 輔助函數 ==========

  /**
   * 從 localStorage 讀取資料
   */
  function loadFromStorage<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        return JSON.parse(raw) as T
      }
    } catch {
      // JSON 解析失敗時忽略
    }
    return null
  }

  /**
   * 儲存資料到 localStorage
   */
  function saveToStorage<T>(key: string, value: T): void {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch {
      // localStorage 寫入失敗時忽略（如隱私模式）
    }
  }

  /**
   * 清除所有認證相關的 localStorage 資料
   */
  function clearStorage(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_INFO)
    } catch {
      // 清除失敗時忽略
    }
  }

  return {
    // 狀態
    token,
    refreshToken,
    expiresIn,
    user,
    // Getter
    isAuthenticated,
    userRole,
    userName,
    userId,
    shopId,
    isManager,
    isBeautician,
    // Actions
    login,
    logout,
    updateToken,
    updateUser,
  }
})
