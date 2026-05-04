// ============================================================================
// 美業 SaaS 智慧管理系統 — 庫存服務
// ============================================================================
// 功能：庫存管理、庫存變動、低庫存預警
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InventoryDAO } from '../dao/InventoryDAO';
import { InventoryLogDAO } from '../dao/InventoryLogDAO';
import { ProductDAO } from '../dao/ProductDAO';
import { Inventory } from '../entity/Inventory';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class InventoryService {
  constructor(
    private readonly inventoryDAO: InventoryDAO,
    private readonly inventoryLogDAO: InventoryLogDAO,
    private readonly productDAO: ProductDAO
  ) {}

  /**
   * 根據 ID 查詢庫存記錄
   */
  async findById(id: number): Promise<Inventory> {
    const inventory = await this.inventoryDAO.findById(id);
    if (!inventory) {
      throw new NotFoundError('庫存記錄不存在');
    }
    return inventory;
  }

  /**
   * 根據商品 ID 查詢庫存
   */
  async findByProductId(productId: number): Promise<Inventory[]> {
    return this.inventoryDAO.findByProductId(productId);
  }

  /**
   * 查詢低庫存商品
   */
  async findLowStock(shopId: number): Promise<Inventory[]> {
    return this.inventoryDAO.findLowStock(shopId);
  }

  /**
   * 查詢即將過期庫存
   */
  async findExpiringSoon(shopId: number, days = 30): Promise<Inventory[]> {
    return this.inventoryDAO.findExpiringSoon(shopId, days);
  }

  /**
   * 入庫
   */
  async inbound(data: {
    shopId: number;
    productId: number;
    batchNo?: string;
    quantity: number;
    unit: string;
    costPrice: number;
    sellingPrice?: number;
    expiryDate?: string;
    remark?: string;
  }): Promise<Inventory> {
    const product = await this.productDAO.findById(data.productId);
    if (!product) {
      throw new NotFoundError('商品不存在');
    }

    // 查找現有批次或創建新批次
    let inventory = await this.inventoryDAO.findByProductId(data.productId)
      .then(list => list.find(i => i.batchNo === data.batchNo));

    if (inventory) {
      // 更新現有庫存
      await this.inventoryDAO.updateQuantity(inventory.id, inventory.quantity + data.quantity);
      inventory.quantity += data.quantity;
    } else {
      // 創建新庫存記錄
      inventory = await this.inventoryDAO.create({
        shopId: data.shopId,
        productId: data.productId,
        batchNo: data.batchNo,
        quantity: data.quantity,
        unit: data.unit,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        expiryDate: data.expiryDate,
        status: 'normal',
      });
    }

    // 記錄庫存變動
    await this.inventoryLogDAO.create({
      inventoryId: inventory.id,
      productId: data.productId,
      shopId: data.shopId,
      changeType: 'inbound',
      quantityChange: data.quantity,
      balanceAfter: inventory.quantity,
      remark: data.remark,
    });

    return inventory;
  }

  /**
   * 出庫
   */
  async outbound(data: {
    shopId: number;
    productId: number;
    quantity: number;
    unit: string;
    remark?: string;
  }): Promise<void> {
    const inventories = await this.inventoryDAO.findByProductId(data.productId);
    const available = inventories.filter(i => i.quantity > 0)
      .sort((a, b) => a.costPrice - b.costPrice); // FIFO

    let remaining = data.quantity;

    for (const inv of available) {
      if (remaining <= 0) break;

      const deductQuantity = Math.min(inv.quantity, remaining);
      await this.inventoryDAO.updateQuantity(inv.id, inv.quantity - deductQuantity);
      remaining -= deductQuantity;

      await this.inventoryLogDAO.create({
        inventoryId: inv.id,
        productId: data.productId,
        shopId: data.shopId,
        changeType: 'outbound',
        quantityChange: -deductQuantity,
        balanceAfter: inv.quantity - deductQuantity,
        remark: data.remark,
      });
    }

    if (remaining > 0) {
      throw new BusinessError('庫存不足');
    }
  }

  /**
   * 庫存盤點
   */
  async check(data: {
    shopId: number;
    items: Array<{
      inventoryId: number;
      actualQuantity: number;
    }>;
  }): Promise<void> {
    for (const item of data.items) {
      const inventory = await this.findById(item.inventoryId);
      const diff = item.actualQuantity - inventory.quantity;

      if (diff !== 0) {
        await this.inventoryDAO.updateQuantity(inventory.id, item.actualQuantity);

        await this.inventoryLogDAO.create({
          inventoryId: inventory.id,
          productId: inventory.productId,
          shopId: data.shopId,
          changeType: 'check',
          quantityChange: diff,
          balanceAfter: item.actualQuantity,
          remark: `盤點調整：原庫存 ${inventory.quantity}，實際 ${item.actualQuantity}`,
        });
      }
    }
  }

  /**
   * 獲取庫存統計
   */
  async getInventoryStats(shopId: number): Promise<{
    totalProducts: number;
    totalQuantity: number;
    lowStockCount: number;
    expiringCount: number;
  }> {
    return this.inventoryDAO.getInventoryStats(shopId);
  }
}
