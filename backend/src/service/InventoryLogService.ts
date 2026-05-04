// ============================================================================
// 美業 SaaS 智慧管理系統 — 庫存變動日誌服務
// ============================================================================
// 功能：庫存變動記錄查詢
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InventoryLogDAO } from '../dao/InventoryLogDAO';
import { InventoryLog } from '../entity/InventoryLog';
import { NotFoundError } from '../filter/exception';

@Provide()
export class InventoryLogService {
  constructor(
    private readonly inventoryLogDAO: InventoryLogDAO
  ) {}

  /**
   * 根據 ID 查詢日誌
   */
  async findById(id: number): Promise<InventoryLog> {
    const log = await this.inventoryLogDAO.findById(id);
    if (!log) {
      throw new NotFoundError('庫存變動記錄不存在');
    }
    return log;
  }

  /**
   * 根據庫存記錄 ID 查詢變動日誌（分頁）
   */
  async findByInventoryId(inventoryId: number, page = 1, pageSize = 20): Promise<{ items: InventoryLog[]; total: number }> {
    const [items, total] = await this.inventoryLogDAO.findByInventoryId(inventoryId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據商品 ID 查詢變動日誌（分頁）
   */
  async findByProductId(productId: number, page = 1, pageSize = 20): Promise<{ items: InventoryLog[]; total: number }> {
    const [items, total] = await this.inventoryLogDAO.findByProductId(productId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據門店查詢變動日誌
   */
  async findByShopId(shopId: number, page = 1, pageSize = 20): Promise<{ items: InventoryLog[]; total: number }> {
    const [items, total] = await this.inventoryLogDAO.findByShopId(shopId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據變動類型查詢（分頁）
   */
  async findByChangeType(shopId: number, changeType: 'inbound' | 'outbound' | 'pick' | 'return' | 'check' | 'adjustment', page = 1, pageSize = 20): Promise<{ items: InventoryLog[]; total: number }> {
    const [items, total] = await this.inventoryLogDAO.findByChangeType(shopId, changeType, page, pageSize);
    return { items, total };
  }
}
