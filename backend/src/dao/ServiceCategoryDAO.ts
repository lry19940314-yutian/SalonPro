// ============================================================================
// 美業 SaaS 智慧管理系統 — 服務分類 DAO
// ============================================================================
// 功能：服務分類表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, In } from 'typeorm';
import { ServiceCategory } from '../entity/ServiceCategory';

@Provide()
export class ServiceCategoryDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢服務分類
   *
   * @param id - 分類 ID
   * @returns 服務分類實體或 null
   */
  async findById(id: number): Promise<ServiceCategory | null> {
    return this.entityManager.findOne(ServiceCategory, {
      where: { id },
    });
  }

  /**
   * 根據門店 ID 查詢所有服務分類
   *
   * @param shopId - 門店 ID
   * @returns 服務分類列表
   */
  async findByShopId(shopId: number): Promise<ServiceCategory[]> {
    return this.entityManager.find(ServiceCategory, {
      where: { shopId },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 根據門店 ID 查詢啟用中的服務分類
   *
   * @param shopId - 門店 ID
   * @returns 服務分類列表
   */
  async findActiveByShopId(shopId: number): Promise<ServiceCategory[]> {
    return this.entityManager.find(ServiceCategory, {
      where: { shopId, status: 1 },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 根據 ID 列表批量查詢
   *
   * @param ids - 分類 ID 列表
   * @returns 服務分類列表
   */
  async findByIds(ids: number[]): Promise<ServiceCategory[]> {
    return this.entityManager.find(ServiceCategory, {
      where: { id: In(ids) },
    });
  }

  /**
   * 創建服務分類
   *
   * @param category - 服務分類實體
   * @returns 創建後的服務分類
   */
  async create(category: Partial<ServiceCategory>): Promise<ServiceCategory> {
    const entity = this.entityManager.create(ServiceCategory, category);
    return this.entityManager.save(entity);
  }

  /**
   * 更新服務分類
   *
   * @param id - 分類 ID
   * @param data - 更新數據
   * @returns 更新後的服務分類
   */
  async update(id: number, data: Partial<ServiceCategory>): Promise<ServiceCategory | null> {
    await this.entityManager.update(ServiceCategory, id, data);
    return this.findById(id);
  }

  /**
   * 刪除服務分類
   *
   * @param id - 分類 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(ServiceCategory, id);
  }

  /**
   * 獲取指定門店的最大排序值
   *
   * @param shopId - 門店 ID
   * @returns 最大排序值
   */
  async getMaxSortOrder(shopId: number): Promise<number> {
    const result = await this.entityManager
      .createQueryBuilder(ServiceCategory, 'category')
      .select('MAX(category.sortOrder)', 'maxOrder')
      .where('category.shopId = :shopId', { shopId })
      .getRawOne();
    return result?.maxOrder ?? 0;
  }
}
