// ============================================================================
// 美業 SaaS 智慧管理系統 — 認證相關 DTO（參數校驗）
// ============================================================================
// 功能：使用 @midwayjs/validate 進行參數校驗
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 登錄請求 DTO
 */
export class LoginDTO {
  @Rule(
    RuleType.string()
      .required()
      .min(2)
      .max(20)
      .messages({
        'string.empty': '客戶代碼不可為空',
        'string.min': '客戶代碼長度至少為 2 個字元',
        'string.max': '客戶代碼長度不可超過 20 個字元',
        'any.required': '客戶代碼為必填項',
      })
  )
  shopCode: string;

  @Rule(
    RuleType.string()
      .required()
      .min(2)
      .max(50)
      .messages({
        'string.empty': '登錄帳號不可為空',
        'string.min': '登錄帳號長度至少為 2 個字元',
        'string.max': '登錄帳號長度不可超過 50 個字元',
        'any.required': '登錄帳號為必填項',
      })
  )
  username: string;

  @Rule(
    RuleType.string()
      .required()
      .min(6)
      .max(100)
      .messages({
        'string.empty': '密碼不可為空',
        'string.min': '密碼長度至少為 6 個字元',
        'string.max': '密碼長度不可超過 100 個字元',
        'any.required': '密碼為必填項',
      })
  )
  password: string;
}

/**
 * Token 刷新請求 DTO
 */
export class RefreshTokenDTO {
  @Rule(
    RuleType.string()
      .required()
      .messages({
        'string.empty': 'Refresh Token 不可為空',
        'any.required': 'Refresh Token 為必填項',
      })
  )
  refreshToken: string;
}
