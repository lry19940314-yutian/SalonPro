// ============================================================================
// 美業 SaaS 智慧管理系統 — 操作日誌服務
// ============================================================================
// 功能：操作日誌記錄與查詢
// ============================================================================

import { Provide } from '@midwayjs/core';
import { OperationLogDAO } from '../dao/OperationLogDAO';
import { OperationLog } from '../entity/OperationLog';

@Provide()
export class OperationLogService {
  constructor(
    private readonly operationLogDAO: OperationLogDAO
  ) {}

  /**
   * 根據 ID 查詢日誌
   */
  async findById(id: number): Promise<OperationLog | null> {
    return this.operationLogDAO.findById(id);
  }

  /**
   * 根據門店查詢日誌
   */
  async findByShopId(shopId: number, page = 1, pageSize = 20): Promise<{ items: OperationLog[]; total: number }> {
    const [items, total] = await this.operationLogDAO.findByShopId(shopId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據模塊查詢日誌
   */
  async findByModule(shopId: number, module: string, page = 1, pageSize = 20): Promise<{ items: OperationLog[]; total: number }> {
    const [items, total] = await this.operationLogDAO.findByModule(shopId, module, page, pageSize);
    return { items, total };
  }

  /**
   * 記錄操作日誌
   */
  async log(data: {
    shopId: number;
    staffId: number;
    module: string;
    action: string;
    targetType?: string;
    targetId?: number;
    detail?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<OperationLog> {
    return this.operationLogDAO.create(data);
  }

  /**
   * 批量記錄操作日誌
   */
  async logBatch(logs: Array<{
    shopId: number;
    staffId: number;
    module: string;
    action: string;
    targetType?: string;
    targetId?: number;
    detail?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }>): Promise<OperationLog[]> {
    return this.operationLogDAO.createBatch(logs);
  }

  /**
   * 清理指定日期之前的日誌
   */
  async cleanBefore(date: Date): Promise<number> {
    return this.operationLogDAO.cleanBefore(date);
  }
}
