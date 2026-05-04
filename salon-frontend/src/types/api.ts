/**
 * api.ts - API 通用類型定義
 *
 * 功能：
 * 1. 定義統一 API 響應結構
 * 2. 定義分頁請求/響應類型
 * 3. 定義登錄相關類型
 *
 * 技術棧：TypeScript
 */

/** 統一 API 響應結構 */
export interface ApiResponse<T = unknown> {
  /** 狀態碼（200 成功，其他為錯誤） */
  code: number
  /** 響應訊息 */
  message: string
  /** 響應數據 */
  data: T
  /** 請求追蹤 ID（用於除錯） */
  traceId?: string
}

/** 分頁請求參數 */
export interface PaginationParams {
  /** 當前頁碼（從 1 開始） */
  page: number
  /** 每頁筆數 */
  pageSize: number
}

/** 分頁響應數據 */
export interface PaginatedData<T> {
  /** 數據列表 */
  list: T[]
  /** 總筆數 */
  total: number
  /** 當前頁碼 */
  page: number
  /** 每頁筆數 */
  pageSize: number
  /** 總頁數 */
  totalPages: number
}

/** 登錄請求參數 */
export interface LoginParams {
  /** 客戶代碼（門店代碼） */
  shopCode: string
  /** 員工帳號 */
  username: string
  /** 密碼 */
  password: string
}

/** 登錄響應數據 */
export interface LoginResult {
  /** JWT Access Token */
  accessToken: string
  /** Refresh Token */
  refreshToken: string
  /** Token 過期時間戳（秒） */
  expiresIn: number
  /** 使用者資訊 */
  user: {
    /** 員工 ID */
    id: number
    /** 姓名 */
    name: string
    /** 角色：manager（店長）| beautician（美容師） */
    role: 'manager' | 'beautician'
    /** 所屬門店 ID */
    shopId: number
    /** 頭像 URL */
    avatar: string
    /** 手機號碼 */
    phone?: string
    /** 職稱 */
    title?: string
  }
}

/** Token 刷新請求參數 */
export interface RefreshTokenParams {
  /** Refresh Token */
  refreshToken: string
}

/** Token 刷新響應數據 */
export interface RefreshTokenResult {
  /** 新的 Access Token */
  accessToken: string
  /** 新的 Refresh Token */
  refreshToken: string
  /** 新的過期時間戳（秒） */
  expiresIn: number
}
