// ============================================================================
// 美業 SaaS 智慧管理系統 — 抽成 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 抽成統計查詢 DTO
 */
export class CommissionStatsDTO {
  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .messages({
        'string.empty': '起始日期不可為空',
        'string.pattern.base': '日期格式必須為 YYYY-MM-DD',
        'any.required': '起始日期為必填項',
      })
  )
  startDate: string;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .messages({
        'string.empty': '結束日期不可為空',
        'string.pattern.base': '日期格式必須為 YYYY-MM-DD',
        'any.required': '結束日期為必填項',
      })
  )
  endDate: string;
}
