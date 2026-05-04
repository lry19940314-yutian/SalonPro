// ============================================================================
// 美業 SaaS 智慧管理系統 — 庫存 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 入庫 DTO
 */
export class InboundDTO {
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

  @Rule(
    RuleType.number()
      .required()
      .integer()
      .min(1)
      .messages({
        'number.base': '入庫數量必須為數字',
        'number.integer': '入庫數量必須為整數',
        'number.min': '入庫數量至少為 1',
        'any.required': '入庫數量為必填項',
      })
  )
  quantity: number;

  @Rule(RuleType.string().max(50).optional())
  batchNo?: string;

  @Rule(RuleType.number().min(0).optional())
  costPrice?: number;

  @Rule(RuleType.number().min(0).optional())
  sellingPrice?: number;

  @Rule(RuleType.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional())
  expiryDate?: string;

  @Rule(RuleType.string().max(500).optional())
  remark?: string;
}

/**
 * 出庫 DTO
 */
export class OutboundDTO {
  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .messages({
        'number.base': '庫存 ID 必須為數字',
        'number.integer': '庫存 ID 必須為整數',
        'number.positive': '庫存 ID 必須為正數',
        'any.required': '庫存 ID 為必填項',
      })
  )
  inventoryId: number;

  @Rule(
    RuleType.number()
      .required()
      .integer()
      .min(1)
      .messages({
        'number.base': '出庫數量必須為數字',
        'number.integer': '出庫數量必須為整數',
        'number.min': '出庫數量至少為 1',
        'any.required': '出庫數量為必填項',
      })
  )
  quantity: number;

  @Rule(RuleType.string().max(500).optional())
  remark?: string;
}

/**
 * 庫存盤點 DTO
 */
export class InventoryCheckDTO {
  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .messages({
        'number.base': '庫存 ID 必須為數字',
        'number.integer': '庫存 ID 必須為整數',
        'number.positive': '庫存 ID 必須為正數',
        'any.required': '庫存 ID 為必填項',
      })
  )
  inventoryId: number;

  @Rule(
    RuleType.number()
      .required()
      .integer()
      .min(0)
      .messages({
        'number.base': '實際庫存數量必須為數字',
        'number.integer': '實際庫存數量必須為整數',
        'number.min': '實際庫存數量不可為負數',
        'any.required': '實際庫存數量為必填項',
      })
  )
  actualQuantity: number;

  @Rule(RuleType.string().max(500).optional())
  remark?: string;
}
