// ============================================================================
// 美業 SaaS 智慧管理系統 — 優惠券 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建優惠券 DTO
 */
export class CreateCouponDTO {
  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(100)
      .messages({
        'string.empty': '優惠券名稱不可為空',
        'string.min': '優惠券名稱長度至少為 1 個字元',
        'string.max': '優惠券名稱長度不可超過 100 個字元',
        'any.required': '優惠券名稱為必填項',
      })
  )
  name: string;

  @Rule(
    RuleType.string()
      .required()
      .valid('discount', 'deduction', 'gift')
      .messages({
        'string.empty': '優惠券類型不可為空',
        'any.only': '優惠券類型必須為 discount、deduction 或 gift',
        'any.required': '優惠券類型為必填項',
      })
  )
  type: 'discount' | 'deduction' | 'gift';

  @Rule(
    RuleType.number()
      .required()
      .min(0)
      .messages({
        'number.base': '優惠值必須為數字',
        'number.min': '優惠值不可為負數',
        'any.required': '優惠值為必填項',
      })
  )
  value: number;

  @Rule(RuleType.number().min(0).optional())
  conditionAmount?: number;

  @Rule(RuleType.number().integer().min(1).optional())
  validDays?: number;

  @Rule(RuleType.date().optional())
  validStart?: string;

  @Rule(RuleType.date().optional())
  validEnd?: string;

  @Rule(RuleType.number().integer().min(0).optional())
  totalQuantity?: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;

  @Rule(RuleType.string().max(500).optional())
  description?: string;
}

/**
 * 更新優惠券 DTO
 */
export class UpdateCouponDTO {
  @Rule(RuleType.string().min(1).max(100).optional())
  name?: string;

  @Rule(RuleType.string().valid('discount', 'deduction', 'gift').optional())
  type?: 'discount' | 'deduction' | 'gift';

  @Rule(RuleType.number().min(0).optional())
  value?: number;

  @Rule(RuleType.number().min(0).optional())
  conditionAmount?: number;

  @Rule(RuleType.number().integer().min(1).optional())
  validDays?: number;

  @Rule(RuleType.date().optional())
  validStart?: string;

  @Rule(RuleType.date().optional())
  validEnd?: string;

  @Rule(RuleType.number().integer().min(0).optional())
  totalQuantity?: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;

  @Rule(RuleType.string().max(500).optional())
  description?: string;
}

/**
 * 發放優惠券給會員 DTO
 */
export class IssueCouponDTO {
  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .messages({
        'number.base': '會員 ID 必須為數字',
        'number.integer': '會員 ID 必須為整數',
        'number.positive': '會員 ID 必須為正數',
        'any.required': '會員 ID 為必填項',
      })
  )
  memberId: number;

  @Rule(RuleType.number().integer().min(1).max(100).optional())
  quantity?: number;
}
