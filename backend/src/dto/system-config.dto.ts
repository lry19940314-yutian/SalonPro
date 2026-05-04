// ============================================================================
// 美業 SaaS 智慧管理系統 — 系統配置 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建設置 DTO
 */
export class CreateSystemConfigDTO {
  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(100)
      .messages({
        'string.empty': '配置鍵名不可為空',
        'string.min': '配置鍵名長度至少為 1 個字元',
        'string.max': '配置鍵名長度不可超過 100 個字元',
        'any.required': '配置鍵名為必填項',
      })
  )
  configKey: string;

  @Rule(
    RuleType.string()
      .required()
      .messages({
        'string.empty': '配置值不可為空',
        'any.required': '配置值為必填項',
      })
  )
  configValue: string;

  @Rule(RuleType.string().max(255).optional())
  description?: string;
}

/**
 * 更新設置 DTO
 */
export class UpdateSystemConfigDTO {
  @Rule(RuleType.string().min(1).max(100).optional())
  configKey?: string;

  @Rule(RuleType.string().optional())
  configValue?: string;

  @Rule(RuleType.string().max(255).optional())
  description?: string;
}

/**
 * 更新配置值 DTO
 */
export class UpsertConfigDTO {
  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(100)
      .messages({
        'string.empty': '配置鍵名不可為空',
        'string.min': '配置鍵名長度至少為 1 個字元',
        'string.max': '配置鍵名長度不可超過 100 個字元',
        'any.required': '配置鍵名為必填項',
      })
  )
  configKey: string;

  @Rule(
    RuleType.string()
      .required()
      .messages({
        'string.empty': '配置值不可為空',
        'any.required': '配置值為必填項',
      })
  )
  configValue: string;

  @Rule(RuleType.string().max(255).optional())
  description?: string;
}

/**
 * 批量設置配置 DTO
 */
export class BatchSetConfigDTO {
  @Rule(
    RuleType.object()
      .required()
      .pattern(/.*/, RuleType.any())
      .messages({
        'object.base': '配置列表必須為物件',
        'any.required': '配置列表為必填項',
      })
  )
  configs: Record<string, string>;
}
