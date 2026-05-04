// ============================================================================
// 美業 SaaS 智慧管理系統 — 通用類型定義
// ============================================================================

// ========== 統一 API 響應格式 ==========

/**
 * 統一 API 響應格式
 */
export interface ApiResponse<T = unknown> {
  /** 狀態碼，200 為成功 */
  code: number;
  /** 提示訊息 */
  message: string;
  /** 響應數據 */
  data: T;
  /** 請求追蹤 ID（用於除錯） */
  traceId?: string;
  /** 時間戳 */
  timestamp: number;
}

/**
 * 分頁響應數據
 */
export interface PaginatedData<T> {
  /** 數據列表 */
  list: T[];
  /** 總筆數 */
  total: number;
  /** 當前頁碼 */
  page: number;
  /** 每頁筆數 */
  pageSize: number;
  /** 總頁數 */
  totalPages: number;
}

/**
 * 分頁請求參數
 */
export interface PaginationParams {
  /** 當前頁碼（從 1 開始） */
  page: number;
  /** 每頁筆數 */
  pageSize: number;
}

// ========== JWT Payload ==========

/**
 * JWT Token 承載數據
 */
export interface JwtPayload {
  /** 員工 ID */
  staffId: number;
  /** 門店 ID */
  shopId: number;
  /** 門店代碼 */
  shopCode: string;
  /** 角色代碼 */
  roleCode: string;
  /** Token 類型：access / refresh */
  type: 'access' | 'refresh';
}

// ========== 請求上下文擴展 ==========

/**
 * 擴展的請求上下文（掛載在 ctx.state 上）
 */
export interface RequestContext {
  /** 當前登錄員工 ID */
  staffId: number;
  /** 當前登錄門店 ID */
  shopId: number;
  /** 門店代碼 */
  shopCode: string;
  /** 角色代碼 */
  roleCode: string;
  /** 角色 ID */
  roleId: number;
  /** 員工姓名 */
  staffName: string;
}

// ========== 登錄相關 ==========

/**
 * 登錄請求參數
 */
export interface LoginParams {
  /** 客戶代碼（門店代碼） */
  shopCode: string;
  /** 登錄帳號 */
  username: string;
  /** 登錄密碼 */
  password: string;
}

/**
 * 登錄響應數據
 */
export interface LoginResult {
  /** Access Token */
  accessToken: string;
  /** Refresh Token */
  refreshToken: string;
  /** Access Token 過期時間戳（秒） */
  expiresIn: number;
  /** 使用者資訊 */
  user: {
    /** 員工 ID */
    id: number;
    /** 姓名 */
    name: string;
    /** 角色代碼 */
    role: string;
    /** 所屬門店 ID */
    shopId: number;
    /** 門店代碼 */
    shopCode: string;
    /** 門店名稱 */
    shopName: string;
    /** 頭像 URL */
    avatar: string;
    /** 手機號碼 */
    phone?: string;
    /** 職稱 */
    title?: string;
  };
}

/**
 * Token 刷新響應數據
 */
export interface RefreshTokenResult {
  /** 新的 Access Token */
  accessToken: string;
  /** 新的 Refresh Token */
  refreshToken: string;
  /** 新的 Access Token 過期時間戳（秒） */
  expiresIn: number;
}
