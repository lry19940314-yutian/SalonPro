// ============================================================================
// 美業 SaaS 智慧管理系統 — 請假 DAO
// ============================================================================
// 功能：請假表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { Leave } from '../entity/Leave';

@Provide()
export class LeaveDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢請假記錄
   *
   * @param id - 請假 ID
   * @returns 請假實體或 null
   */
  async findById(id: number): Promise<Leave | null> {
    return this.entityManager.findOne(Leave, {
      where: { id },
    });
  }

  /**
   * 根據美容師 ID 查詢請假記錄
   *
   * @param staffId - 美容師 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 請假記錄列表及總數
   */
  async findByStaffId(
    staffId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Leave[], number]> {
    return this.entityManager.findAndCount(Leave, {
      where: { staffId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據門店 ID 查詢請假記錄
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 請假記錄列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Leave[], number]> {
    return this.entityManager.findAndCount(Leave, {
      where: { shopId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 查詢指定日期範圍內的請假記錄
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 請假記錄列表
   */
  async findByDateRange(
    shopId: number,
    startDate: string,
    endDate: string
  ): Promise<Leave[]> {
    return this.entityManager
      .createQueryBuilder(Leave, 'leave')
      .where('leave.shopId = :shopId', { shopId })
      .andWhere(
        '(leave.startDate BETWEEN :startDate AND :endDate OR leave.endDate BETWEEN :startDate AND :endDate)',
        { startDate, endDate }
      )
      .orderBy('leave.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 查詢待審批的請假記錄
   *
   * @param shopId - 門店 ID
   * @returns 請假記錄列表
   */
  async findPending(shopId: number): Promise<Leave[]> {
    return this.entityManager.find(Leave, {
      where: { shopId, status: 'pending' },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 檢查指定日期範圍內是否存在衝突的請假記錄
   *
   * @param staffId - 美容師 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @param excludeId - 排除的請假 ID
   * @returns 是否存在衝突
   */
  async checkConflict(
    staffId: number,
    startDate: string,
    endDate: string,
    excludeId?: number
  ): Promise<boolean> {
    const queryBuilder = this.entityManager
      .createQueryBuilder(Leave, 'leave')
      .where('leave.staffId = :staffId', { staffId })
      .andWhere('leave.status IN (:...statuses)', {
        statuses: ['pending', 'approved'],
      })
      .andWhere(
        '(leave.startDate <= :endDate AND leave.endDate >= :startDate)',
        { startDate, endDate }
      );

    if (excludeId) {
      queryBuilder.andWhere('leave.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * 創建請假記錄
   *
   * @param leave - 請假實體
   * @returns 創建後的請假記錄
   */
  async create(leave: Partial<Leave>): Promise<Leave> {
    const entity = this.entityManager.create(Leave, leave);
    return this.entityManager.save(entity);
  }

  /**
   * 更新請假記錄
   *
   * @param id - 請假 ID
   * @param data - 更新數據
   * @returns 更新後的請假記錄
   */
  async update(id: number, data: Partial<Leave>): Promise<Leave | null> {
    await this.entityManager.update(Leave, id, data as any);
    return this.findById(id);
  }

  /**
   * 審批請假
   *
   * @param id - 請假 ID
   * @param status - 審批狀態
   * @param approvedBy - 審批人 ID
   */
  async approve(id: number, status: 'approved' | 'rejected', approvedBy: number): Promise<void> {
    await this.entityManager.update(Leave, id, {
      status,
      approvedBy,
    } as any);
  }

  /**
   * 刪除請假記錄
   *
   * @param id - 請假 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(Leave, id);
  }
}
