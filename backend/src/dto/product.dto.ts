// ============================================================================
// 美業 SaaS 智慧管理系統 — 產品 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建產品 DTO
 */
export class CreateProductDTO {
  @Rule(RuleType.number().integer().positive().optional())
  categoryId?: number;

  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(100)
      .messages({
        'string.empty': '產品名稱不可為空',
        'string.min': '產品名稱長度至少為 1 個字元',
        'string.max': '產品名稱長度不可超過 100 個字元',
        'any.required': '產品名稱為必填項',
      })
  )
  name: string;

  @Rule(RuleType.string().max(50).optional())
  barcode?: string;

  @Rule(RuleType.string().max(100).optional())
  brand?: string;

  @Rule(RuleType.string().max(50).optional())
  specification?: string;

  @Rule(RuleType.string().max(20).optional())
  unit?: string;

  @Rule(RuleType.number().min(0).optional())
  costPrice?: number;

  @Rule(
    RuleType.number()
      .required()
      .min(0)
      .messages({
        'number.base': '售價必須為數字',
        'number.min': '售價不可為負數',
        'any.required': '售價為必填項',
      })
  )
  sellingPrice: number;

  @Rule(RuleType.string().valid('fixed', 'percent').optional())
  commissionType?: 'fixed' | 'percent';

  @Rule(RuleType.number().min(0).optional())
  commissionValue?: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;
}

/**
 * 更新產品 DTO
 */
export class UpdateProductDTO {
  @Rule(RuleType.number().integer().positive().optional())
  categoryId?: number;

  @Rule(RuleType.string().min(1).max(100).optional())
  name?: string;

  @Rule(RuleType.string().max(50).optional())
  barcode?: string;

  @Rule(RuleType.string().max(100).optional())
  brand?: string;

  @Rule(RuleType.string().max(50).optional())
  specification?: string;

  @Rule(RuleType.string().max(20).optional())
  unit?: string;

  @Rule(RuleType.number().min(0).optional())
  costPrice?: number;

  @Rule(RuleType.number().min(0).optional())
  sellingPrice?: number;

  @Rule(RuleType.string().valid('fixed', 'percent').optional())
  commissionType?: 'fixed' | 'percent';

  @Rule(RuleType.number().min(0).optional())
  commissionValue?: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;
}
