// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建會員 DTO
 */
export class CreateMemberDTO {
  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(50)
      .messages({
        'string.empty': '會員姓名不可為空',
        'string.min': '會員姓名長度至少為 1 個字元',
        'string.max': '會員姓名長度不可超過 50 個字元',
        'any.required': '會員姓名為必填項',
      })
  )
  name: string;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^1[3-9]\d{9}$/)
      .messages({
        'string.empty': '手機號碼不可為空',
        'string.pattern.base': '手機號碼格式不正確',
        'any.required': '手機號碼為必填項',
      })
  )
  phone: string;

  @Rule(RuleType.date().optional())
  birthday?: string;

  @Rule(RuleType.number().valid(0, 1, 2).optional())
  gender?: number;

  @Rule(RuleType.number().integer().positive().optional())
  levelId?: number;

  @Rule(RuleType.string().max(50).optional())
  skinType?: string;

  @Rule(RuleType.string().max(500).optional())
  allergyInfo?: string;

  @Rule(RuleType.object().optional())
  preferences?: Record<string, unknown>;

  @Rule(RuleType.array().items(RuleType.string()).optional())
  tags?: string[];

  @Rule(RuleType.string().max(500).optional())
  remark?: string;
}

/**
 * 更新會員 DTO
 */
export class UpdateMemberDTO {
  @Rule(RuleType.string().min(1).max(50).optional())
  name?: string;

  @Rule(
    RuleType.string()
      .pattern(/^1[3-9]\d{9}$/)
      .optional()
  )
  phone?: string;

  @Rule(RuleType.date().optional())
  birthday?: string;

  @Rule(RuleType.number().valid(0, 1, 2).optional())
  gender?: number;

  @Rule(RuleType.number().integer().positive().optional())
  levelId?: number;

  @Rule(RuleType.string().max(50).optional())
  skinType?: string;

  @Rule(RuleType.string().max(500).optional())
  allergyInfo?: string;

  @Rule(RuleType.object().optional())
  preferences?: Record<string, unknown>;

  @Rule(RuleType.array().items(RuleType.string()).optional())
  tags?: string[];

  @Rule(RuleType.string().max(500).optional())
  remark?: string;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;
}

/**
 * 會員搜索 DTO
 */
export class SearchMemberDTO {
  @Rule(RuleType.string().optional())
  keyword?: string;

  @Rule(RuleType.number().integer().positive().optional())
  levelId?: number;

  @Rule(RuleType.number().valid(0, 1, 2).optional())
  gender?: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;

  @Rule(RuleType.date().optional())
  startDate?: string;

  @Rule(RuleType.date().optional())
  endDate?: string;

  @Rule(RuleType.number().integer().min(1).optional())
  page?: number;

  @Rule(RuleType.number().integer().min(1).max(100).optional())
  pageSize?: number;
}
