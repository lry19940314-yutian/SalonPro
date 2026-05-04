// ============================================================================
// 美業 SaaS 智慧管理系統 — 庫存 DAO
// ============================================================================
// 功能：庫存表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, In, LessThanOrEqual } from 'typeorm';
import { Inventory } from '../entity/Inventory';

@Provide()
export class InventoryDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢庫存記錄
   *
   * @param id - 庫存 ID
   * @returns 庫存實體或 null
   */
  async findById(id: number): Promise<Inventory | null> {
    return this.entityManager.findOne(Inventory, {
      where: { id },
    });
  }

  /**
   * 根據門店 ID 查詢所有庫存
   *
   * @param shopId - 門店 ID
   * @returns 庫存列表
   */
  async findByShopId(shopId: number): Promise<Inventory[]> {
    return this.entityManager.find(Inventory, {
      where: { shopId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根據產品 ID 查詢庫存
   *
   * @param productId - 產品 ID
   * @returns 庫存列表
   */
  async findByProductId(productId: number): Promise<Inventory[]> {
    return this.entityManager.find(Inventory, {
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根據產品 ID 列表批量查詢庫存
   *
   * @param productIds - 產品 ID 列表
   * @returns 庫存列表
   */
  async findByProductIds(productIds: number[]): Promise<Inventory[]> {
    return this.entityManager.find(Inventory, {
      where: { productId: In(productIds) },
    });
  }

  /**
   * 查詢庫存不足的商品
   *
   * @param shopId - 門店 ID
   * @returns 庫存列表
   */
  async findLowStock(shopId: number): Promise<Inventory[]> {
    return this.entityManager
      .createQueryBuilder(Inventory, 'inventory')
      .where('inventory.shopId = :shopId', { shopId })
      .andWhere('inventory.quantity <= inventory.minQuantity')
      .orderBy('inventory.quantity', 'ASC')
      .getMany();
  }

  /**
   * 查詢即將過期的庫存
   *
   * @param shopId - 門店 ID
   * @param days - 距離過期的天數
   * @returns 庫存列表
   */
  async findExpiringSoon(shopId: number, days: number): Promise<Inventory[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const dateStr = futureDate.toISOString().split('T')[0];

    return this.entityManager
      .createQueryBuilder(Inventory, 'inventory')
      .where('inventory.shopId = :shopId', { shopId })
      .andWhere('inventory.expiryDate IS NOT NULL')
      .andWhere('inventory.expiryDate <= :dateStr', { dateStr })
      .andWhere('inventory.quantity > 0')
      .orderBy('inventory.expiryDate', 'ASC')
      .getMany();
  }

  /**
   * 創建庫存記錄
   *
   * @param inventory - 庫存實體
   * @returns 創建後的庫存
   */
  async create(inventory: Partial<Inventory>): Promise<Inventory> {
    const entity = this.entityManager.create(Inventory, inventory);
    return this.entityManager.save(entity);
  }

  /**
   * 更新庫存
   *
   * @param id - 庫存 ID
   * @param data - 更新數據
   * @returns 更新後的庫存
   */
  async update(id: number, data: Partial<Inventory>): Promise<Inventory | null> {
    await this.entityManager.update(Inventory, id, data as any);
    return this.findById(id);
  }

  /**
   * 增減庫存數量（原子操作）
   *
   * @param id - 庫存 ID
   * @param quantity - 增減數量（正數增加，負數減少）
   */
  async updateQuantity(id: number, quantity: number): Promise<void> {
    await this.entityManager
      .createQueryBuilder()
      .update(Inventory)
      .set({ quantity: () => `quantity + ${quantity}` })
      .where('id = :id', { id })
      .andWhere(`quantity + ${quantity} >= 0`)
      .execute();
  }

  /**
   * 刪除庫存記錄
   *
   * @param id - 庫存 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(Inventory, id);
  }

  /**
   * 獲取庫存統計
   *
   * @param shopId - 門店 ID
   * @returns 統計信息
   */
  async getInventoryStats(shopId: number): Promise<{
    totalProducts: number;
    totalQuantity: number;
    lowStockCount: number;
    expiringCount: number;
  }> {
    const totalResult = await this.entityManager
      .createQueryBuilder(Inventory, 'inventory')
      .select([
        'COUNT(DISTINCT inventory.productId) AS totalProducts',
        'COALESCE(SUM(inventory.quantity), 0) AS totalQuantity',
      ])
      .where('inventory.shopId = :shopId', { shopId })
      .getRawOne();

    const lowStockCount = await this.entityManager
      .createQueryBuilder(Inventory, 'inventory')
      .where('inventory.shopId = :shopId', { shopId })
      .andWhere('inventory.quantity <= inventory.minQuantity')
      .getCount();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().split('T')[0];

    const expiringCount = await this.entityManager
      .createQueryBuilder(Inventory, 'inventory')
      .where('inventory.shopId = :shopId', { shopId })
      .andWhere('inventory.expiryDate IS NOT NULL')
      .andWhere('inventory.expiryDate <= :dateStr', { dateStr })
      .andWhere('inventory.quantity > 0')
      .getCount();

    return {
      totalProducts: Number(totalResult?.totalProducts || 0),
      totalQuantity: Number(totalResult?.totalQuantity || 0),
      lowStockCount,
      expiringCount,
    };
  }
}
