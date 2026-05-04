// ============================================================================
// 美業 SaaS 智慧管理系統 — 操作日誌 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建操作日誌 DTO
 */
export class CreateOperationLogDTO {
  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(50)
      .messages({
        'string.empty': '操作模塊不可為空',
        'string.min': '操作模塊長度至少為 1 個字元',
        'string.max': '操作模塊長度不可超過 50 個字元',
        'any.required': '操作模塊為必填項',
      })
  )
  module: string;

  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(50)
      .messages({
        'string.empty': '操作類型不可為空',
        'string.min': '操作類型長度至少為 1 個字元',
        'string.max': '操作類型長度不可超過 50 個字元',
        'any.required': '操作類型為必填項',
      })
  )
  action: string;

  @Rule(RuleType.string().max(500).optional())
  detail?: string;

  @Rule(RuleType.number().integer().positive().optional())
  targetId?: number;

  @Rule(RuleType.string().max(255).optional())
  ip?: string;

  @Rule(RuleType.string().max(500).optional())
  userAgent?: string;
}

/**
 * 清理日誌 DTO
 */
export class CleanLogDTO {
  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .messages({
        'string.empty': '日期不可為空',
        'string.pattern.base': '日期格式必須為 YYYY-MM-DD',
        'any.required': '日期為必填項',
      })
  )
  beforeDate: string;
}
