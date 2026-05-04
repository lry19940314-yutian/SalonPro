/**
 * request.ts - Axios 請求封裝
 *
 * 功能：
 * 1. 建立 Axios 實例，配置基礎 URL、超時時間
 * 2. 請求攔截器：自動附加 JWT Token、設備類型 Header
 * 3. 響應攔截器：統一錯誤處理、Token 過期自動刷新
 * 4. 支援請求重試機制
 *
 * 技術棧：Axios + TypeScript
 */

import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getDeviceType } from '@/composables/useDevice'
import type { ApiResponse } from '@/types/api'

/** 認證相關 localStorage 鍵名 */
const STORAGE_KEYS = {
  TOKEN: 'salon_token',
  REFRESH_TOKEN: 'salon_refresh_token',
} as const

/** 是否正在刷新 Token 的標記 */
let isRefreshing = false

/** 等待 Token 刷新完成的通知隊列 */
let refreshSubscribers: ((token: string) => void)[] = []

/**
 * Token 刷新完成後，通知所有等待中的請求
 */
function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach((callback) => callback(newToken))
  refreshSubscribers = []
}

/**
 * 將請求加入等待隊列
 */
function addRefreshSubscriber(callback: (token: string) => void): void {
  refreshSubscribers.push(callback)
}

/**
 * 從 localStorage 取得 Token
 */
function getToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  } catch {
    return null
  }
}

/**
 * 從 localStorage 取得 Refresh Token
 */
function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  } catch {
    return null
  }
}

/**
 * 建立 Axios 實例
 */
const service: AxiosInstance = axios.create({
  // API 基礎路徑，由環境變數配置
  baseURL: import.meta.env.VITE_API_BASE_URL as string || '/api/v1',

  // 請求超時時間（15 秒）
  timeout: 15000,

  // 請求頭
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

// ==================== 請求攔截器 ====================

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. 附加 JWT Token
    const token = getToken()
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // 2. 附加設備類型 Header（供後端區分 PC / 移動端）
    if (config.headers) {
      config.headers['X-Device-Type'] = getDeviceType()
    }

    // 3. 開發環境輸出請求日誌
    if (import.meta.env.DEV) {
      console.log(`[API 請求] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data)
    }

    return config
  },
  (error) => {
    console.error('[API 請求錯誤]', error)
    return Promise.reject(error)
  }
)

// ==================== 響應攔截器 ====================

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data

    // 開發環境輸出響應日誌
    if (import.meta.env.DEV) {
      console.log(`[API 響應] ${response.config.url}`, res)
    }

    // 後端統一回傳格式：{ code, message, data }
    // code 為 200 表示成功
    if (res.code !== 200) {
      // 處理特定錯誤碼
      handleBusinessError(res.code, res.message)
      return Promise.reject(new Error(res.message || '請求失敗'))
    }

    return response
  },
  async (error) => {
    // 沒有響應（網路錯誤）
    if (!error.response) {
      console.error('[網路錯誤] 無法連接到伺服器')
      ElMessage.error('網路連線異常，請檢查網路設定')
      return Promise.reject(error)
    }

    const { status, config } = error.response

    // 401：Token 過期或無效，嘗試自動刷新
    // 注意：登錄接口（/auth/login）返回 401 時不應嘗試刷新 Token，
    // 應直接將錯誤傳遞給調用方處理（如 LoginView 中的 catch 塊）
    if (status === 401) {
      // 如果是刷新 Token 的請求本身也返回 401，直接登出
      if (config.url?.includes('/auth/refresh')) {
        handleTokenExpired()
        return Promise.reject(error)
      }

      // 登錄接口返回 401（帳號密碼錯誤），直接傳遞錯誤，不嘗試刷新 Token
      if (config.url?.includes('/auth/login')) {
        return Promise.reject(error)
      }

      // 嘗試刷新 Token
      const newToken = await tryRefreshToken()
      if (newToken) {
        // 更新原請求的 Token 後重試
        config.headers['Authorization'] = `Bearer ${newToken}`
        return service(config)
      } else {
        // 刷新失敗，登出
        handleTokenExpired()
        return Promise.reject(error)
      }
    }

    // 403：無權限
    if (status === 403) {
      ElMessage.error('您沒有權限執行此操作')
      return Promise.reject(error)
    }

    // 500：伺服器錯誤
    if (status >= 500) {
      ElMessage.error('伺服器異常，請稍後再試')
      return Promise.reject(error)
    }

    // 其他錯誤
    ElMessage.error(error.response.data?.message || '請求失敗')
    return Promise.reject(error)
  }
)

/**
 * 處理業務邏輯錯誤碼
 */
function handleBusinessError(code: number, message: string): void {
  switch (code) {
    case 4001:
      // 帳號或密碼錯誤
      ElMessage.error('客戶代碼、帳號或密碼錯誤')
      break
    case 4002:
      // 帳號已被停用
      ElMessage.error('此帳號已被停用，請聯繫管理員')
      break
    case 4003:
      // 客戶代碼不存在
      ElMessage.error('客戶代碼不存在')
      break
    case 4004:
      // Token 已過期
      ElMessage.warning('登入狀態已過期，請重新登入')
      break
    default:
      ElMessage.error(message || '操作失敗')
  }
}

/**
 * 嘗試刷新 Token
 */
async function tryRefreshToken(): Promise<string | null> {
  const refreshTokenValue = getRefreshToken()
  if (!refreshTokenValue) {
    return null
  }

  if (isRefreshing) {
    // 正在刷新中，將請求加入等待隊列
    return new Promise((resolve) => {
      addRefreshSubscriber((newToken: string) => {
        resolve(newToken)
      })
    })
  }

  isRefreshing = true

  try {
    const response = await axios.post<ApiResponse<{
      accessToken: string
      refreshToken: string
      expiresIn: number
    }>>(
      `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
      { refreshToken: refreshTokenValue }
    )

    const { accessToken: newToken, refreshToken: newRefreshToken } = response.data.data

    // 更新 localStorage
    localStorage.setItem(STORAGE_KEYS.TOKEN, newToken)
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken)

    // 通知等待中的請求
    onTokenRefreshed(newToken)

    return newToken
  } catch {
    // 刷新失敗
    return null
  } finally {
    isRefreshing = false
  }
}

/**
 * 處理 Token 過期（強制登出）
 */
function handleTokenExpired(): void {
  // 清除認證資訊
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem('salon_user_info')

  // 跳轉至登入頁
  window.location.href = '/login'
}

// 動態導入 Element Plus 的 Message，避免循環依賴
let ElMessage: any
function ensureMessageLoaded(): void {
  if (!ElMessage) {
    // 使用動態導入確保 Element Plus 已載入
    import('element-plus').then((module) => {
      ElMessage = module.ElMessage
    }).catch(() => {
      // Element Plus 未載入（移動端），使用 Vant 的 Toast
      import('vant').then((module) => {
        ElMessage = {
          error: (msg: string) => module.showToast({ message: msg, type: 'fail' }),
          warning: (msg: string) => module.showToast({ message: msg, type: 'fail' }),
          success: (msg: string) => module.showToast({ message: msg, type: 'success' }),
        }
      })
    })
  }
}

// 初始化 Message
ensureMessageLoaded()

/**
 * 封裝 GET 請求
 */
export function get<T = unknown>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.get(url, { params, ...config }).then((res) => res.data)
}

/**
 * 封裝 POST 請求
 */
export function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.post(url, data, config).then((res) => res.data)
}

/**
 * 封裝 PUT 請求
 */
export function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.put(url, data, config).then((res) => res.data)
}

/**
 * 封裝 DELETE 請求
 */
export function del<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.delete(url, config).then((res) => res.data)
}

/**
 * 封裝上傳檔案（FormData）
 */
export function upload<T = unknown>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return service.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config,
  }).then((res) => res.data)
}

export default service
