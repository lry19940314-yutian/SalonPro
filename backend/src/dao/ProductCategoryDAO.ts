// ============================================================================
// 美業 SaaS 智慧管理系統 — 產品分類 DAO
// ============================================================================
// 功能：產品分類表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, In } from 'typeorm';
import { ProductCategory } from '../entity/ProductCategory';

@Provide()
export class ProductCategoryDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢產品分類
   *
   * @param id - 分類 ID
   * @returns 產品分類實體或 null
   */
  async findById(id: number): Promise<ProductCategory | null> {
    return this.entityManager.findOne(ProductCategory, {
      where: { id },
    });
  }

  /**
   * 根據門店 ID 查詢所有產品分類
   *
   * @param shopId - 門店 ID
   * @returns 產品分類列表
   */
  async findByShopId(shopId: number): Promise<ProductCategory[]> {
    return this.entityManager.find(ProductCategory, {
      where: { shopId },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 根據門店 ID 查詢啟用中的產品分類
   *
   * @param shopId - 門店 ID
   * @returns 產品分類列表
   */
  async findActiveByShopId(shopId: number): Promise<ProductCategory[]> {
    return this.entityManager.find(ProductCategory, {
      where: { shopId, status: 1 },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 根據 ID 列表批量查詢
   *
   * @param ids - 分類 ID 列表
   * @returns 產品分類列表
   */
  async findByIds(ids: number[]): Promise<ProductCategory[]> {
    return this.entityManager.find(ProductCategory, {
      where: { id: In(ids) },
    });
  }

  /**
   * 創建產品分類
   *
   * @param category - 產品分類實體
   * @returns 創建後的產品分類
   */
  async create(category: Partial<ProductCategory>): Promise<ProductCategory> {
    const entity = this.entityManager.create(ProductCategory, category);
    return this.entityManager.save(entity);
  }

  /**
   * 更新產品分類
   *
   * @param id - 分類 ID
   * @param data - 更新數據
   * @returns 更新後的產品分類
   */
  async update(id: number, data: Partial<ProductCategory>): Promise<ProductCategory | null> {
    await this.entityManager.update(ProductCategory, id, data);
    return this.findById(id);
  }

  /**
   * 刪除產品分類
   *
   * @param id - 分類 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(ProductCategory, id);
  }

  /**
   * 獲取指定門店的最大排序值
   *
   * @param shopId - 門店 ID
   * @returns 最大排序值
   */
  async getMaxSortOrder(shopId: number): Promise<number> {
    const result = await this.entityManager
      .createQueryBuilder(ProductCategory, 'category')
      .select('MAX(category.sortOrder)', 'maxOrder')
      .where('category.shopId = :shopId', { shopId })
      .getRawOne();
    return result?.maxOrder ?? 0;
  }
}
