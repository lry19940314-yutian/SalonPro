// ============================================================================
// 美業 SaaS 智慧管理系統 — 產品 DAO
// ============================================================================
// 功能：產品表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, In, Like } from 'typeorm';
import { Product } from '../entity/Product';

@Provide()
export class ProductDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢產品
   *
   * @param id - 產品 ID
   * @returns 產品實體或 null
   */
  async findById(id: number): Promise<Product | null> {
    return this.entityManager.findOne(Product, {
      where: { id },
    });
  }

  /**
   * 根據門店 ID 查詢所有產品
   *
   * @param shopId - 門店 ID
   * @returns 產品列表
   */
  async findByShopId(shopId: number): Promise<Product[]> {
    return this.entityManager.find(Product, {
      where: { shopId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根據分類 ID 查詢產品
   *
   * @param categoryId - 分類 ID
   * @returns 產品列表
   */
  async findByCategoryId(categoryId: number): Promise<Product[]> {
    return this.entityManager.find(Product, {
      where: { categoryId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根據條碼查詢產品
   *
   * @param barcode - 條碼
   * @returns 產品實體或 null
   */
  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.entityManager.findOne(Product, {
      where: { barcode },
    });
  }

  /**
   * 根據 ID 列表批量查詢
   *
   * @param ids - 產品 ID 列表
   * @returns 產品列表
   */
  async findByIds(ids: number[]): Promise<Product[]> {
    return this.entityManager.find(Product, {
      where: { id: In(ids) },
    });
  }

  /**
   * 根據名稱或條碼模糊查詢
   *
   * @param shopId - 門店 ID
   * @param keyword - 關鍵字
   * @returns 產品列表
   */
  async search(shopId: number, keyword: string): Promise<Product[]> {
    return this.entityManager.find(Product, {
      where: [
        { shopId, name: Like(`%${keyword}%`) },
        { shopId, barcode: Like(`%${keyword}%`) },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 創建產品
   *
   * @param product - 產品實體
   * @returns 創建後的產品
   */
  async create(product: Partial<Product>): Promise<Product> {
    const entity = this.entityManager.create(Product, product);
    return this.entityManager.save(entity);
  }

  /**
   * 更新產品
   *
   * @param id - 產品 ID
   * @param data - 更新數據
   * @returns 更新後的產品
   */
  async update(id: number, data: Partial<Product>): Promise<Product | null> {
    await this.entityManager.update(Product, id, data);
    return this.findById(id);
  }

  /**
   * 刪除產品
   *
   * @param id - 產品 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(Product, id);
  }

  /**
   * 更新產品庫存數量
   *
   * @param id - 產品 ID
   * @param quantity - 增減數量（正數增加，負數減少）
   */
  async updateStock(id: number, quantity: number): Promise<void> {
    await this.entityManager
      .createQueryBuilder()
      .update(Product)
      .set({ stock: () => `stock + ${quantity}` })
      .where('id = :id', { id })
      .execute();
  }

  /**
   * 查詢庫存不足的產品
   *
   * @param shopId - 門店 ID
   * @returns 產品列表
   */
  async findLowStock(shopId: number): Promise<Product[]> {
    return this.entityManager
      .createQueryBuilder(Product, 'product')
      .where('product.shopId = :shopId', { shopId })
      .andWhere('product.stock <= product.minStock')
      .orderBy('product.stock', 'ASC')
      .getMany();
  }
}
