// ============================================================================
// 美業 SaaS 智慧管理系統 — 領料明細 DAO
// ============================================================================
// 功能：領料明細表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { PickItem } from '../entity/PickItem';

@Provide()
export class PickItemDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢領料明細
   *
   * @param id - 明細 ID
   * @returns 領料明細實體或 null
   */
  async findById(id: number): Promise<PickItem | null> {
    return this.entityManager.findOne(PickItem, {
      where: { id },
    });
  }

  /**
   * 根據領料單 ID 查詢所有明細
   *
   * @param pickOrderId - 領料單 ID
   * @returns 領料明細列表
   */
  async findByPickOrderId(pickOrderId: number): Promise<PickItem[]> {
    return this.entityManager.find(PickItem, {
      where: { pickOrderId },
      order: { id: 'ASC' },
    });
  }

  /**
   * 批量創建領料明細
   *
   * @param items - 領料明細實體列表
   * @returns 創建後的領料明細列表
   */
  async createBatch(items: Partial<PickItem>[]): Promise<PickItem[]> {
    const entities = this.entityManager.create(PickItem, items);
    return this.entityManager.save(entities);
  }

  /**
   * 刪除領料明細
   *
   * @param id - 明細 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(PickItem, id);
  }

  /**
   * 根據領料單 ID 刪除所有明細
   *
   * @param pickOrderId - 領料單 ID
   */
  async deleteByPickOrderId(pickOrderId: number): Promise<void> {
    await this.entityManager.delete(PickItem, { pickOrderId });
  }
}
