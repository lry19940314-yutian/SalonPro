// ============================================================================
// 美業 SaaS 智慧管理系統 — 服務項目 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建服務項目 DTO
 */
export class CreateServiceItemDTO {
  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .messages({
        'number.base': '分類 ID 必須為數字',
        'any.required': '分類 ID 為必填項',
      })
  )
  categoryId: number;

  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(100)
      .messages({
        'string.empty': '服務名稱不可為空',
        'string.min': '服務名稱長度至少為 1 個字元',
        'string.max': '服務名稱長度不可超過 100 個字元',
        'any.required': '服務名稱為必填項',
      })
  )
  name: string;

  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .max(1440)
      .messages({
        'number.base': '服務時長必須為數字',
        'number.positive': '服務時長必須大於 0',
        'number.max': '服務時長不可超過 1440 分鐘',
        'any.required': '服務時長為必填項',
      })
  )
  duration: number;

  @Rule(
    RuleType.number()
      .required()
      .min(0)
      .messages({
        'number.base': '價格必須為數字',
        'number.min': '價格不可為負數',
        'any.required': '價格為必填項',
      })
  )
  price: number;

  @Rule(RuleType.string().max(20).optional())
  color?: string;

  @Rule(RuleType.string().valid('fixed', 'percent').optional())
  commissionType?: 'fixed' | 'percent';

  @Rule(RuleType.number().min(0).optional())
  commissionValue?: number;

  @Rule(RuleType.number().integer().min(0).optional())
  sortOrder?: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;
}

/**
 * 更新服務項目 DTO
 */
export class UpdateServiceItemDTO {
  @Rule(RuleType.number().integer().positive().optional())
  categoryId?: number;

  @Rule(RuleType.string().min(1).max(100).optional())
  name?: string;

  @Rule(RuleType.number().integer().positive().max(1440).optional())
  duration?: number;

  @Rule(RuleType.number().min(0).optional())
  price?: number;

  @Rule(RuleType.string().max(20).optional())
  color?: string;

  @Rule(RuleType.string().valid('fixed', 'percent').optional())
  commissionType?: 'fixed' | 'percent';

  @Rule(RuleType.number().min(0).optional())
  commissionValue?: number;

  @Rule(RuleType.number().integer().min(0).optional())
  sortOrder?: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;
}
