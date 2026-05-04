// ============================================================================
// 美業 SaaS 智慧管理系統 — 佣金結算 DAO
// ============================================================================
// 功能：佣金結算表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { CommissionSettlement } from '../entity/CommissionSettlement';

@Provide()
export class CommissionSettlementDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢結算記錄
   *
   * @param id - 結算 ID
   * @returns 結算記錄實體或 null
   */
  async findById(id: number): Promise<CommissionSettlement | null> {
    return this.entityManager.findOne(CommissionSettlement, {
      where: { id },
    });
  }

  /**
   * 根據美容師 ID 查詢結算記錄
   *
   * @param staffId - 美容師 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 結算記錄列表及總數
   */
  async findByStaffId(
    staffId: number,
    page = 1,
    pageSize = 20
  ): Promise<[CommissionSettlement[], number]> {
    return this.entityManager.findAndCount(CommissionSettlement, {
      where: { staffId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據門店 ID 查詢結算記錄
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 結算記錄列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[CommissionSettlement[], number]> {
    return this.entityManager.findAndCount(CommissionSettlement, {
      where: { shopId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 查詢指定日期範圍的結算記錄
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 結算記錄列表
   */
  async findByDateRange(
    shopId: number,
    startDate: string,
    endDate: string
  ): Promise<CommissionSettlement[]> {
    return this.entityManager
      .createQueryBuilder(CommissionSettlement, 'settlement')
      .where('settlement.shopId = :shopId', { shopId })
      .andWhere('settlement.periodStart BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('settlement.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 查詢指定狀態的結算記錄
   *
   * @param shopId - 門店 ID
   * @param status - 結算狀態
   * @returns 結算記錄列表
   */
  async findByStatus(
    shopId: number,
    status: 'pending' | 'confirmed' | 'paid'
  ): Promise<CommissionSettlement[]> {
    return this.entityManager.find(CommissionSettlement, {
      where: { shopId, status },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 創建結算記錄
   *
   * @param settlement - 結算記錄實體
   * @returns 創建後的結算記錄
   */
  async create(settlement: Partial<CommissionSettlement>): Promise<CommissionSettlement> {
    const entity = this.entityManager.create(CommissionSettlement, settlement);
    return this.entityManager.save(entity);
  }

  /**
   * 更新結算記錄
   *
   * @param id - 結算 ID
   * @param data - 更新數據
   * @returns 更新後的結算記錄
   */
  async update(id: number, data: Partial<CommissionSettlement>): Promise<CommissionSettlement | null> {
    await this.entityManager.update(CommissionSettlement, id, data as any);
    return this.findById(id);
  }

  /**
   * 確認結算
   *
   * @param id - 結算 ID
   */
  async confirm(id: number): Promise<void> {
    await this.entityManager.update(CommissionSettlement, id, {
      status: 'confirmed',
    } as any);
  }

  /**
   * 標記為已支付
   *
   * @param id - 結算 ID
   */
  async markAsPaid(id: number): Promise<void> {
    await this.entityManager.update(CommissionSettlement, id, {
      status: 'paid',
    } as any);
  }
}
