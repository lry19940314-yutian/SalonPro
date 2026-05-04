// ============================================================================
// 美業 SaaS 智慧管理系統 — 員工門店關聯 DAO
// ============================================================================
// 功能：員工門店關聯表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { StaffShop } from '../entity/StaffShop';

@Provide()
export class StaffShopDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢關聯記錄
   *
   * @param id - 關聯 ID
   * @returns 關聯記錄實體或 null
   */
  async findById(id: number): Promise<StaffShop | null> {
    return this.entityManager.findOne(StaffShop, {
      where: { id },
    });
  }

  /**
   * 根據員工 ID 查詢所有關聯門店
   *
   * @param staffId - 員工 ID
   * @returns 關聯記錄列表
   */
  async findByStaffId(staffId: number): Promise<StaffShop[]> {
    return this.entityManager.find(StaffShop, {
      where: { staffId },
    });
  }

  /**
   * 根據門店 ID 查詢所有關聯員工
   *
   * @param shopId - 門店 ID
   * @returns 關聯記錄列表
   */
  async findByShopId(shopId: number): Promise<StaffShop[]> {
    return this.entityManager.find(StaffShop, {
      where: { shopId },
    });
  }

  /**
   * 查詢員工的主要門店
   *
   * @param staffId - 員工 ID
   * @returns 關聯記錄或 null
   */
  async findPrimaryByStaffId(staffId: number): Promise<StaffShop | null> {
    return this.entityManager.findOne(StaffShop, {
      where: { staffId, isPrimary: 1 },
    });
  }

  /**
   * 創建關聯記錄
   *
   * @param staffShop - 關聯記錄實體
   * @returns 創建後的關聯記錄
   */
  async create(staffShop: Partial<StaffShop>): Promise<StaffShop> {
    const entity = this.entityManager.create(StaffShop, staffShop);
    return this.entityManager.save(entity);
  }

  /**
   * 更新關聯記錄
   *
   * @param id - 關聯 ID
   * @param data - 更新數據
   * @returns 更新後的關聯記錄
   */
  async update(id: number, data: Partial<StaffShop>): Promise<StaffShop | null> {
    await this.entityManager.update(StaffShop, id, data as any);
    return this.findById(id);
  }

  /**
   * 刪除關聯記錄
   *
   * @param id - 關聯 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(StaffShop, id);
  }

  /**
   * 根據員工 ID 刪除所有關聯
   *
   * @param staffId - 員工 ID
   */
  async deleteByStaffId(staffId: number): Promise<void> {
    await this.entityManager.delete(StaffShop, { staffId });
  }
}
