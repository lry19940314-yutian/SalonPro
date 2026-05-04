// ============================================================================
// 美業 SaaS 智慧管理系統 — 業績記錄 DAO
// ============================================================================
// 功能：業績記錄表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, Between } from 'typeorm';
import { Performance } from '../entity/Performance';

@Provide()
export class PerformanceDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢業績記錄
   *
   * @param id - 業績記錄 ID
   * @returns 業績記錄實體或 null
   */
  async findById(id: number): Promise<Performance | null> {
    return this.entityManager.findOne(Performance, {
      where: { id },
    });
  }

  /**
   * 根據美容師 ID 查詢業績
   *
   * @param staffId - 美容師 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 業績記錄列表及總數
   */
  async findByStaffId(
    staffId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Performance[], number]> {
    return this.entityManager.findAndCount(Performance, {
      where: { staffId },
      order: { performanceDate: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據門店 ID 查詢業績
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 業績記錄列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Performance[], number]> {
    return this.entityManager.findAndCount(Performance, {
      where: { shopId },
      order: { performanceDate: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據預約 ID 查詢業績
   *
   * @param appointmentId - 預約 ID
   * @returns 業績記錄列表
   */
  async findByAppointmentId(appointmentId: number): Promise<Performance[]> {
    return this.entityManager.find(Performance, {
      where: { appointmentId },
    });
  }

  /**
   * 查詢指定日期範圍的業績
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 業績記錄列表
   */
  async findByDateRange(
    shopId: number,
    startDate: string,
    endDate: string
  ): Promise<Performance[]> {
    return this.entityManager.find(Performance, {
      where: {
        shopId,
        performanceDate: Between(startDate, endDate),
      },
      order: { performanceDate: 'DESC' },
    });
  }

  /**
   * 查詢指定美容師指定日期範圍的業績
   *
   * @param staffId - 美容師 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 業績記錄列表
   */
  async findByStaffIdAndDateRange(
    staffId: number,
    startDate: string,
    endDate: string
  ): Promise<Performance[]> {
    return this.entityManager.find(Performance, {
      where: {
        staffId,
        performanceDate: Between(startDate, endDate),
      },
      order: { performanceDate: 'DESC' },
    });
  }

  /**
   * 查詢未結算的業績
   *
   * @param shopId - 門店 ID
   * @returns 業績記錄列表
   */
  async findUnsettled(shopId: number): Promise<Performance[]> {
    return this.entityManager.find(Performance, {
      where: { shopId, settled: 0 },
      order: { performanceDate: 'ASC' },
    });
  }

  /**
   * 創建業績記錄
   *
   * @param performance - 業績記錄實體
   * @returns 創建後的業績記錄
   */
  async create(performance: Partial<Performance>): Promise<Performance> {
    const entity = this.entityManager.create(Performance, performance);
    return this.entityManager.save(entity);
  }

  /**
   * 批量創建業績記錄
   *
   * @param performances - 業績記錄實體列表
   * @returns 創建後的業績記錄列表
   */
  async createBatch(performances: Partial<Performance>[]): Promise<Performance[]> {
    const entities = this.entityManager.create(Performance, performances);
    return this.entityManager.save(entities);
  }

  /**
   * 標記業績為已結算
   *
   * @param ids - 業績記錄 ID 列表
   */
  async markAsSettled(ids: number[]): Promise<void> {
    await this.entityManager
      .createQueryBuilder()
      .update(Performance)
      .set({ settled: true })
      .where('id IN (:...ids)', { ids })
      .execute();
  }

  /**
   * 獲取美容師業績統計
   *
   * @param staffId - 美容師 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 統計信息
   */
  async getStaffPerformanceStats(
    staffId: number,
    startDate: string,
    endDate: string
  ): Promise<{
    totalAmount: number;
    totalCommission: number;
    serviceCount: number;
    productCount: number;
  }> {
    const result = await this.entityManager
      .createQueryBuilder(Performance, 'performance')
      .select([
        'COALESCE(SUM(performance.amount), 0) AS totalAmount',
        'COALESCE(SUM(performance.commissionAmount), 0) AS totalCommission',
        "SUM(CASE WHEN performance.type = 'service' THEN 1 ELSE 0 END) AS serviceCount",
        "SUM(CASE WHEN performance.type = 'product' THEN 1 ELSE 0 END) AS productCount",
      ])
      .where('performance.staffId = :staffId', { staffId })
      .andWhere('performance.performanceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return {
      totalAmount: Number(result?.totalAmount || 0),
      totalCommission: Number(result?.totalCommission || 0),
      serviceCount: Number(result?.serviceCount || 0),
      productCount: Number(result?.productCount || 0),
    };
  }

  /**
   * 獲取門店業績統計
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 統計信息
   */
  async getShopPerformanceStats(
    shopId: number,
    startDate: string,
    endDate: string
  ): Promise<{
    totalAmount: number;
    totalCommission: number;
    totalCount: number;
  }> {
    const result = await this.entityManager
      .createQueryBuilder(Performance, 'performance')
      .select([
        'COALESCE(SUM(performance.amount), 0) AS totalAmount',
        'COALESCE(SUM(performance.commissionAmount), 0) AS totalCommission',
        'COUNT(*) AS totalCount',
      ])
      .where('performance.shopId = :shopId', { shopId })
      .andWhere('performance.performanceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return {
      totalAmount: Number(result?.totalAmount || 0),
      totalCommission: Number(result?.totalCommission || 0),
      totalCount: Number(result?.totalCount || 0),
    };
  }
}
