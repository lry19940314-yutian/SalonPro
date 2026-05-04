// ============================================================================
// 美業 SaaS 智慧管理系統 — 服務項目 DAO
// ============================================================================
// 功能：服務項目表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, In, Between } from 'typeorm';
import { ServiceItem } from '../entity/ServiceItem';

@Provide()
export class ServiceItemDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢服務項目
   *
   * @param id - 服務項目 ID
   * @returns 服務項目實體或 null
   */
  async findById(id: number): Promise<ServiceItem | null> {
    return this.entityManager.findOne(ServiceItem, {
      where: { id },
    });
  }

  /**
   * 根據門店 ID 查詢所有服務項目
   *
   * @param shopId - 門店 ID
   * @returns 服務項目列表
   */
  async findByShopId(shopId: number): Promise<ServiceItem[]> {
    return this.entityManager.find(ServiceItem, {
      where: { shopId },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 根據分類 ID 查詢服務項目
   *
   * @param categoryId - 分類 ID
   * @returns 服務項目列表
   */
  async findByCategoryId(categoryId: number): Promise<ServiceItem[]> {
    return this.entityManager.find(ServiceItem, {
      where: { categoryId },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 根據門店 ID 查詢啟用中的服務項目
   *
   * @param shopId - 門店 ID
   * @returns 服務項目列表
   */
  async findActiveByShopId(shopId: number): Promise<ServiceItem[]> {
    return this.entityManager.find(ServiceItem, {
      where: { shopId, status: 1 },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 根據 ID 列表批量查詢
   *
   * @param ids - 服務項目 ID 列表
   * @returns 服務項目列表
   */
  async findByIds(ids: number[]): Promise<ServiceItem[]> {
    return this.entityManager.find(ServiceItem, {
      where: { id: In(ids) },
    });
  }

  /**
   * 根據名稱模糊查詢
   *
   * @param shopId - 門店 ID
   * @param keyword - 關鍵字
   * @returns 服務項目列表
   */
  async searchByName(shopId: number, keyword: string): Promise<ServiceItem[]> {
    return this.entityManager
      .createQueryBuilder(ServiceItem, 'item')
      .where('item.shopId = :shopId', { shopId })
      .andWhere('item.name LIKE :keyword', { keyword: `%${keyword}%` })
      .andWhere('item.status = 1')
      .orderBy('item.sortOrder', 'ASC')
      .getMany();
  }

  /**
   * 創建服務項目
   *
   * @param item - 服務項目實體
   * @returns 創建後的服務項目
   */
  async create(item: Partial<ServiceItem>): Promise<ServiceItem> {
    const entity = this.entityManager.create(ServiceItem, item);
    return this.entityManager.save(entity);
  }

  /**
   * 更新服務項目
   *
   * @param id - 服務項目 ID
   * @param data - 更新數據
   * @returns 更新後的服務項目
   */
  async update(id: number, data: Partial<ServiceItem>): Promise<ServiceItem | null> {
    await this.entityManager.update(ServiceItem, id, data);
    return this.findById(id);
  }

  /**
   * 刪除服務項目
   *
   * @param id - 服務項目 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(ServiceItem, id);
  }

  /**
   * 獲取指定門店的最大排序值
   *
   * @param shopId - 門店 ID
   * @returns 最大排序值
   */
  async getMaxSortOrder(shopId: number): Promise<number> {
    const result = await this.entityManager
      .createQueryBuilder(ServiceItem, 'item')
      .select('MAX(item.sortOrder)', 'maxOrder')
      .where('item.shopId = :shopId', { shopId })
      .getRawOne();
    return result?.maxOrder ?? 0;
  }

  /**
   * 根據價格範圍查詢服務項目
   *
   * @param shopId - 門店 ID
   * @param minPrice - 最低價格
   * @param maxPrice - 最高價格
   * @returns 服務項目列表
   */
  async findByPriceRange(shopId: number, minPrice: number, maxPrice: number): Promise<ServiceItem[]> {
    return this.entityManager.find(ServiceItem, {
      where: {
        shopId,
        price: Between(minPrice, maxPrice),
        status: 1,
      },
      order: { sortOrder: 'ASC' },
    });
  }
}
