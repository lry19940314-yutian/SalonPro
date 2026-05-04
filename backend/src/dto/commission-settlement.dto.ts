// ============================================================================
// 美業 SaaS 智慧管理系統 — 抽成結算 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建抽成結算 DTO
 */
export class CreateCommissionSettlementDTO {
  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .messages({
        'number.base': '美容師 ID 必須為數字',
        'number.integer': '美容師 ID 必須為整數',
        'number.positive': '美容師 ID 必須為正數',
        'any.required': '美容師 ID 為必填項',
      })
  )
  staffId: number;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .messages({
        'string.empty': '結算週期起始日不可為空',
        'string.pattern.base': '日期格式必須為 YYYY-MM-DD',
        'any.required': '結算週期起始日為必填項',
      })
  )
  periodStart: string;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .messages({
        'string.empty': '結算週期結束日不可為空',
        'string.pattern.base': '日期格式必須為 YYYY-MM-DD',
        'any.required': '結算週期結束日為必填項',
      })
  )
  periodEnd: string;

  @Rule(RuleType.string().max(500).optional())
  remark?: string;
}

/**
 * 更新抽成結算 DTO
 */
export class UpdateCommissionSettlementDTO {
  @Rule(RuleType.string().max(500).optional())
  remark?: string;
}
