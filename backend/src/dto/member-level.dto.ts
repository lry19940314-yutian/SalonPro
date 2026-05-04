// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員等級 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建會員等級 DTO
 */
export class CreateMemberLevelDTO {
  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(50)
      .messages({
        'string.empty': '等級名稱不可為空',
        'string.min': '等級名稱長度至少為 1 個字元',
        'string.max': '等級名稱長度不可超過 50 個字元',
        'any.required': '等級名稱為必填項',
      })
  )
  name: string;

  @Rule(
    RuleType.number()
      .required()
      .integer()
      .min(1)
      .messages({
        'number.base': '等級值必須為數字',
        'number.integer': '等級值必須為整數',
        'number.min': '等級值至少為 1',
        'any.required': '等級值為必填項',
      })
  )
  level: number;

  @Rule(
    RuleType.number()
      .required()
      .min(0)
      .messages({
        'number.base': '最低消費必須為數字',
        'number.min': '最低消費不可為負數',
        'any.required': '最低消費為必填項',
      })
  )
  minConsumption: number;

  @Rule(RuleType.number().min(0).max(100).optional())
  discountRate?: number;

  @Rule(RuleType.string().max(20).optional())
  color?: string;

  @Rule(RuleType.array().items(RuleType.string()).optional())
  benefits?: string[];
}

/**
 * 更新會員等級 DTO
 */
export class UpdateMemberLevelDTO {
  @Rule(RuleType.string().min(1).max(50).optional())
  name?: string;

  @Rule(RuleType.number().integer().min(1).optional())
  level?: number;

  @Rule(RuleType.number().min(0).optional())
  minConsumption?: number;

  @Rule(RuleType.number().min(0).max(100).optional())
  discountRate?: number;

  @Rule(RuleType.string().max(20).optional())
  color?: string;

  @Rule(RuleType.array().items(RuleType.string()).optional())
  benefits?: string[];
}
