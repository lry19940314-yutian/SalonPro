// ============================================================================
// 美業 SaaS 智慧管理系統 — 請假 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建請假 DTO
 */
export class CreateLeaveDTO {
  @Rule(
    RuleType.string()
      .required()
      .valid('annual', 'sick', 'personal', 'other')
      .messages({
        'string.empty': '請假類型不可為空',
        'any.only': '請假類型必須為 annual、sick、personal 或 other',
        'any.required': '請假類型為必填項',
      })
  )
  type: 'annual' | 'sick' | 'personal' | 'other';

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .messages({
        'string.empty': '請假起始日期不可為空',
        'string.pattern.base': '日期格式必須為 YYYY-MM-DD',
        'any.required': '請假起始日期為必填項',
      })
  )
  startDate: string;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .messages({
        'string.empty': '請假結束日期不可為空',
        'string.pattern.base': '日期格式必須為 YYYY-MM-DD',
        'any.required': '請假結束日期為必填項',
      })
  )
  endDate: string;

  @Rule(RuleType.string().max(500).optional())
  reason?: string;
}

/**
 * 審批請假 DTO
 */
export class ApproveLeaveDTO {
  @Rule(
    RuleType.string()
      .required()
      .valid('approved', 'rejected')
      .messages({
        'string.empty': '審批狀態不可為空',
        'any.only': '審批狀態必須為 approved 或 rejected',
        'any.required': '審批狀態為必填項',
      })
  )
  status: 'approved' | 'rejected';

  @Rule(RuleType.string().max(500).optional())
  remark?: string;
}

/**
 * 更新請假 DTO
 */
export class UpdateLeaveDTO {
  @Rule(RuleType.string().valid('annual', 'sick', 'personal', 'other').optional())
  type?: 'annual' | 'sick' | 'personal' | 'other';

  @Rule(RuleType.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional())
  startDate?: string;

  @Rule(RuleType.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional())
  endDate?: string;

  @Rule(RuleType.string().max(500).optional())
  reason?: string;
}
