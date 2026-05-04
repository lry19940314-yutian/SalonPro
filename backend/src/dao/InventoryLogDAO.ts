// ============================================================================
// 美業 SaaS 智慧管理系統 — 庫存變動記錄 DAO
// ============================================================================
// 功能：庫存變動記錄表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, Between } from 'typeorm';
import { InventoryLog } from '../entity/InventoryLog';

@Provide()
export class InventoryLogDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢庫存變動記錄
   *
   * @param id - 記錄 ID
   * @returns 庫存變動記錄實體或 null
   */
  async findById(id: number): Promise<InventoryLog | null> {
    return this.entityManager.findOne(InventoryLog, {
      where: { id },
    });
  }

  /**
   * 根據庫存 ID 查詢變動記錄
   *
   * @param inventoryId - 庫存 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 變動記錄列表及總數
   */
  async findByInventoryId(
    inventoryId: number,
    page = 1,
    pageSize = 20
  ): Promise<[InventoryLog[], number]> {
    return this.entityManager.findAndCount(InventoryLog, {
      where: { inventoryId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據產品 ID 查詢變動記錄
   *
   * @param productId - 產品 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 變動記錄列表及總數
   */
  async findByProductId(
    productId: number,
    page = 1,
    pageSize = 20
  ): Promise<[InventoryLog[], number]> {
    return this.entityManager.findAndCount(InventoryLog, {
      where: { productId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據門店 ID 查詢變動記錄
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 變動記錄列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[InventoryLog[], number]> {
    return this.entityManager.findAndCount(InventoryLog, {
      where: { shopId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據變動類型查詢
   *
   * @param shopId - 門店 ID
   * @param changeType - 變動類型
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 變動記錄列表及總數
   */
  async findByChangeType(
    shopId: number,
    changeType: 'inbound' | 'outbound' | 'pick' | 'return' | 'check' | 'adjustment',
    page = 1,
    pageSize = 20
  ): Promise<[InventoryLog[], number]> {
    return this.entityManager.findAndCount(InventoryLog, {
      where: { shopId, changeType },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據時間範圍查詢
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 變動記錄列表
   */
  async findByDateRange(
    shopId: number,
    startDate: Date,
    endDate: Date
  ): Promise<InventoryLog[]> {
    return this.entityManager.find(InventoryLog, {
      where: {
        shopId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 創建庫存變動記錄
   *
   * @param log - 庫存變動記錄實體
   * @returns 創建後的庫存變動記錄
   */
  async create(log: Partial<InventoryLog>): Promise<InventoryLog> {
    const entity = this.entityManager.create(InventoryLog, log);
    return this.entityManager.save(entity);
  }

  /**
   * 批量創建庫存變動記錄
   *
   * @param logs - 庫存變動記錄實體列表
   * @returns 創建後的庫存變動記錄列表
   */
  async createBatch(logs: Partial<InventoryLog>[]): Promise<InventoryLog[]> {
    const entities = this.entityManager.create(InventoryLog, logs);
    return this.entityManager.save(entities);
  }
}
