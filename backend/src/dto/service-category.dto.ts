// ============================================================================
// 美業 SaaS 智慧管理系統 — 服務分類 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建服務分類 DTO
 */
export class CreateServiceCategoryDTO {
  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(50)
      .messages({
        'string.empty': '分類名稱不可為空',
        'string.min': '分類名稱長度至少為 1 個字元',
        'string.max': '分類名稱長度不可超過 50 個字元',
        'any.required': '分類名稱為必填項',
      })
  )
  name: string;

  @Rule(RuleType.number().integer().min(0).optional())
  sortOrder?: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;
}

/**
 * 更新服務分類 DTO
 */
export class UpdateServiceCategoryDTO {
  @Rule(RuleType.string().min(1).max(50).optional())
  name?: string;

  @Rule(RuleType.number().integer().min(0).optional())
  sortOrder?: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;
}
