// ============================================================================
// 美業 SaaS 智慧管理系統 — 領料單服務
// ============================================================================
// 功能：領料單管理、審批、出庫
// ============================================================================

import { Provide } from '@midwayjs/core';
import { PickOrderDAO } from '../dao/PickOrderDAO';
import { PickItemDAO } from '../dao/PickItemDAO';
import { InventoryDAO } from '../dao/InventoryDAO';
import { InventoryLogDAO } from '../dao/InventoryLogDAO';
import { PickOrder } from '../entity/PickOrder';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class PickOrderService {
  constructor(
    private readonly pickOrderDAO: PickOrderDAO,
    private readonly pickItemDAO: PickItemDAO,
    private readonly inventoryDAO: InventoryDAO,
    private readonly inventoryLogDAO: InventoryLogDAO
  ) {}

  /**
   * 根據 ID 查詢領料單
   */
  async findById(id: number): Promise<PickOrder> {
    const order = await this.pickOrderDAO.findById(id);
    if (!order) {
      throw new NotFoundError('領料單不存在');
    }
    return order;
  }

  /**
   * 根據領料單號查詢
   */
  async findByPickNo(pickNo: string): Promise<PickOrder> {
    const order = await this.pickOrderDAO.findByPickNo(pickNo);
    if (!order) {
      throw new NotFoundError('領料單號不存在');
    }
    return order;
  }

  /**
   * 根據門店查詢領料單
   */
  async findByShopId(shopId: number, page = 1, pageSize = 20): Promise<{ items: PickOrder[]; total: number }> {
    const [items, total] = await this.pickOrderDAO.findByShopId(shopId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據狀態查詢領料單
   */
  async findByStatus(shopId: number, status: 'pending' | 'approved' | 'rejected' | 'completed'): Promise<PickOrder[]> {
    return this.pickOrderDAO.findByStatus(shopId, status);
  }

  /**
   * 創建領料單
   */
  async create(data: {
    shopId: number;
    staffId: number;
    items: Array<{
      productId: number;
      inventoryId: number;
      quantity: number;
      unit: string;
    }>;
    remark?: string;
  }): Promise<PickOrder> {
    // 生成領料單號
    const pickNo = await this.generatePickNo(data.shopId);

    // 創建領料單
    const order = await this.pickOrderDAO.create({
      shopId: data.shopId,
      staffId: data.staffId,
      pickNo,
      status: 'pending',
      totalItems: data.items.length,
      remark: data.remark,
    });

    // 創建領料明細
    const items = data.items.map(item => ({
      pickOrderId: order.id,
      productId: item.productId,
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      unit: item.unit,
    }));
    await this.pickItemDAO.createBatch(items);

    return order;
  }

  /**
   * 審批領料單
   */
  async approve(id: number, approvedBy: number, status: 'approved' | 'rejected'): Promise<PickOrder> {
    const order = await this.findById(id);
    if (order.status !== 'pending') {
      throw new BusinessError('該領料單已審批，無法重複操作');
    }

    if (status === 'approved') {
      // 執行出庫
      const items = await this.pickItemDAO.findByPickOrderId(id);

      for (const item of items) {
        const inventory = await this.inventoryDAO.findById(item.inventoryId);
        if (!inventory) {
          throw new BusinessError(`庫存記錄 ${item.inventoryId} 不存在`);
        }
        if (inventory.quantity < item.quantity) {
          throw new BusinessError(`商品庫存不足：${item.productId}`);
        }

        await this.inventoryDAO.updateQuantity(inventory.id, inventory.quantity - item.quantity);

        await this.inventoryLogDAO.create({
          inventoryId: inventory.id,
          productId: item.productId,
          shopId: order.shopId,
          changeType: 'pick',
          quantityChange: -item.quantity,
          balanceAfter: inventory.quantity - item.quantity,
          referenceNo: order.pickNo,
          remark: `領料單 ${order.pickNo}`,
        });
      }
    }

    await this.pickOrderDAO.approve(id, status, approvedBy);
    return this.findById(id);
  }

  /**
   * 完成領料單
   */
  async complete(id: number): Promise<PickOrder> {
    const order = await this.findById(id);
    if (order.status !== 'approved') {
      throw new BusinessError('只有已審批的領料單才能完成');
    }
    await this.pickOrderDAO.complete(id);
    return this.findById(id);
  }

  /**
   * 獲取領料明細
   */
  async getItems(pickOrderId: number) {
    return this.pickItemDAO.findByPickOrderId(pickOrderId);
  }

  /**
   * 生成領料單號
   */
  private async generatePickNo(shopId: number): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PK${dateStr}${timeStr}${random}${String(shopId).padStart(3, '0')}`;
  }
}
