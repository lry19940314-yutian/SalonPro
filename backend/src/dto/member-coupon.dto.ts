// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員優惠券 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 使用優惠券 DTO
 */
export class UseCouponDTO {
  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .messages({
        'number.base': '預約 ID 必須為數字',
        'number.integer': '預約 ID 必須為整數',
        'number.positive': '預約 ID 必須為正數',
        'any.required': '預約 ID 為必填項',
      })
  )
  appointmentId: number;
}
