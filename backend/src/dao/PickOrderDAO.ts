// ============================================================================
// 美業 SaaS 智慧管理系統 — 領料單 DAO
// ============================================================================
// 功能：領料單表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { PickOrder } from '../entity/PickOrder';

@Provide()
export class PickOrderDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢領料單
   *
   * @param id - 領料單 ID
   * @returns 領料單實體或 null
   */
  async findById(id: number): Promise<PickOrder | null> {
    return this.entityManager.findOne(PickOrder, {
      where: { id },
    });
  }

  /**
   * 根據領料單號查詢
   *
   * @param pickNo - 領料單號
   * @returns 領料單實體或 null
   */
  async findByPickNo(pickNo: string): Promise<PickOrder | null> {
    return this.entityManager.findOne(PickOrder, {
      where: { pickNo },
    });
  }

  /**
   * 根據門店 ID 查詢領料單
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 領料單列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[PickOrder[], number]> {
    return this.entityManager.findAndCount(PickOrder, {
      where: { shopId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據美容師 ID 查詢領料單
   *
   * @param staffId - 美容師 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 領料單列表及總數
   */
  async findByStaffId(
    staffId: number,
    page = 1,
    pageSize = 20
  ): Promise<[PickOrder[], number]> {
    return this.entityManager.findAndCount(PickOrder, {
      where: { staffId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據狀態查詢領料單
   *
   * @param shopId - 門店 ID
   * @param status - 領料單狀態
   * @returns 領料單列表
   */
  async findByStatus(
    shopId: number,
    status: 'pending' | 'approved' | 'rejected' | 'completed'
  ): Promise<PickOrder[]> {
    return this.entityManager.find(PickOrder, {
      where: { shopId, status },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 創建領料單
   *
   * @param pickOrder - 領料單實體
   * @returns 創建後的領料單
   */
  async create(pickOrder: Partial<PickOrder>): Promise<PickOrder> {
    const entity = this.entityManager.create(PickOrder, pickOrder);
    return this.entityManager.save(entity);
  }

  /**
   * 更新領料單
   *
   * @param id - 領料單 ID
   * @param data - 更新數據
   * @returns 更新後的領料單
   */
  async update(id: number, data: Partial<PickOrder>): Promise<PickOrder | null> {
    await this.entityManager.update(PickOrder, id, data as any);
    return this.findById(id);
  }

  /**
   * 審批領料單
   *
   * @param id - 領料單 ID
   * @param status - 審批狀態
   * @param approvedBy - 審批人 ID
   */
  async approve(id: number, status: 'approved' | 'rejected', approvedBy: number): Promise<void> {
    await this.entityManager.update(PickOrder, id, {
      status,
      approvedBy,
    } as any);
  }

  /**
   * 完成領料
   *
   * @param id - 領料單 ID
   */
  async complete(id: number): Promise<void> {
    await this.entityManager.update(PickOrder, id, {
      status: 'completed',
    } as any);
  }

  /**
   * 刪除領料單
   *
   * @param id - 領料單 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(PickOrder, id);
  }
}
