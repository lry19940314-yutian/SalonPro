// ============================================================================
// 美業 SaaS 智慧管理系統 — 自定義異常類
// ============================================================================
// 功能：定義業務異常類別，支援統一錯誤處理
// ============================================================================

/**
 * 業務異常 — 所有自定義異常的基類
 */
export class BusinessError extends Error {
  /** HTTP 狀態碼 */
  public statusCode: number;
  /** 業務錯誤碼 */
  public code: number;

  constructor(message: string, statusCode = 400, code = 10000) {
    super(message);
    this.name = 'BusinessError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * 參數校驗異常（400）
 */
export class ValidationError extends BusinessError {
  constructor(message = '請求參數不合法') {
    super(message, 400, 10001);
    this.name = 'ValidationError';
  }
}

/**
 * 認證異常（401）
 */
export class UnauthorizedError extends BusinessError {
  constructor(message = '請先登錄') {
    super(message, 401, 10002);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Token 過期異常（401）
 */
export class TokenExpiredError extends BusinessError {
  constructor(message = 'Token 已過期，請重新登錄') {
    super(message, 401, 10003);
    this.name = 'TokenExpiredError';
  }
}

/**
 * 權限不足異常（403）
 */
export class ForbiddenError extends BusinessError {
  constructor(message = '權限不足，無法執行此操作') {
    super(message, 403, 10004);
    this.name = 'ForbiddenError';
  }
}

/**
 * 資源不存在異常（404）
 */
export class NotFoundError extends BusinessError {
  constructor(message = '請求的資源不存在') {
    super(message, 404, 10005);
    this.name = 'NotFoundError';
  }
}

/**
 * 帳號或密碼錯誤異常（401）
 */
export class InvalidCredentialsError extends BusinessError {
  constructor(message = '客戶代碼、帳號或密碼錯誤') {
    super(message, 401, 10006);
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * 帳號已被停用異常（403）
 */
export class AccountDisabledError extends BusinessError {
  constructor(message = '該帳號已被停用，請聯繫管理員') {
    super(message, 403, 10007);
    this.name = 'AccountDisabledError';
  }
}

/**
 * 門店已停用異常（403）
 */
export class ShopDisabledError extends BusinessError {
  constructor(message = '該門店已停用，請聯繫管理員') {
    super(message, 403, 10008);
    this.name = 'ShopDisabledError';
  }
}
