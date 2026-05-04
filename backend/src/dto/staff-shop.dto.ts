// ============================================================================
// 美業 SaaS 智慧管理系統 — 員工門店關聯 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 分配員工到門店 DTO
 */
export class AssignStaffShopDTO {
  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .messages({
        'number.base': '員工 ID 必須為數字',
        'number.integer': '員工 ID 必須為整數',
        'number.positive': '員工 ID 必須為正數',
        'any.required': '員工 ID 為必填項',
      })
  )
  staffId: number;

  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .messages({
        'number.base': '門店 ID 必須為數字',
        'number.integer': '門店 ID 必須為整數',
        'number.positive': '門店 ID 必須為正數',
        'any.required': '門店 ID 為必填項',
      })
  )
  shopId: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  isPrimary?: number;
}

/**
 * 更新員工門店關聯 DTO
 */
export class UpdateStaffShopDTO {
  @Rule(RuleType.number().valid(0, 1).optional())
  isPrimary?: number;
}
