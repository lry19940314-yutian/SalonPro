// ============================================================================
// 美業 SaaS 智慧管理系統 — 庫存異動日誌 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 庫存異動日誌查詢 DTO
 */
export class QueryInventoryLogDTO {
  @Rule(RuleType.number().integer().positive().optional())
  inventoryId?: number;

  @Rule(RuleType.number().integer().positive().optional())
  productId?: number;

  @Rule(
    RuleType.string()
      .valid('inbound', 'outbound', 'pick', 'return', 'check', 'adjustment')
      .optional()
  )
  changeType?: 'inbound' | 'outbound' | 'pick' | 'return' | 'check' | 'adjustment';

  @Rule(RuleType.number().integer().min(1).optional())
  page?: number;

  @Rule(RuleType.number().integer().min(1).max(100).optional())
  pageSize?: number;
}
