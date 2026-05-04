// ============================================================================
// 美業 SaaS 智慧管理系統 — 領料單 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 領料明細 DTO
 */
export class PickItemDTO {
  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .messages({
        'number.base': '產品 ID 必須為數字',
        'number.integer': '產品 ID 必須為整數',
        'number.positive': '產品 ID 必須為正數',
        'any.required': '產品 ID 為必填項',
      })
  )
  productId: number;

  @Rule(RuleType.number().integer().positive().optional())
  inventoryId?: number;

  @Rule(
    RuleType.number()
      .required()
      .integer()
      .min(1)
      .messages({
        'number.base': '領料數量必須為數字',
        'number.integer': '領料數量必須為整數',
        'number.min': '領料數量至少為 1',
        'any.required': '領料數量為必填項',
      })
  )
  quantity: number;

  @Rule(RuleType.string().max(255).optional())
  remark?: string;
}

/**
 * 創建領料單 DTO
 */
export class CreatePickOrderDTO {
  @Rule(RuleType.string().max(500).optional())
  remark?: string;

  @Rule(
    RuleType.array()
      .required()
      .items(RuleType.object().required())
      .min(1)
      .messages({
        'array.base': '領料明細列表必須為陣列',
        'array.min': '至少需要一個領料項目',
        'any.required': '領料明細列表為必填項',
      })
  )
  items: PickItemDTO[];
}

/**
 * 審批領料單 DTO
 */
export class ApprovePickOrderDTO {
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
