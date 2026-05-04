// ============================================================================
// 美業 SaaS 智慧管理系統 — 佣金明細 DAO
// ============================================================================
// 功能：佣金明細表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, Between } from 'typeorm';
import { Commission } from '../entity/Commission';

@Provide()
export class CommissionDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢佣金明細
   *
   * @param id - 佣金明細 ID
   * @returns 佣金明細實體或 null
   */
  async findById(id: number): Promise<Commission | null> {
    return this.entityManager.findOne(Commission, {
      where: { id },
    });
  }

  /**
   * 根據美容師 ID 查詢佣金
   *
   * @param staffId - 美容師 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 佣金明細列表及總數
   */
  async findByStaffId(
    staffId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Commission[], number]> {
    return this.entityManager.findAndCount(Commission, {
      where: { staffId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據門店 ID 查詢佣金
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 佣金明細列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Commission[], number]> {
    return this.entityManager.findAndCount(Commission, {
      where: { shopId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據結算 ID 查詢佣金
   *
   * @param settlementId - 結算 ID
   * @returns 佣金明細列表
   */
  async findBySettlementId(settlementId: number): Promise<Commission[]> {
    return this.entityManager
      .createQueryBuilder(Commission, 'commission')
      .where('commission.settlementId = :settlementId', { settlementId })
      .getMany();
  }

  /**
   * 查詢未結算的佣金
   *
   * @param staffId - 美容師 ID
   * @returns 佣金明細列表
   */
  async findUnsettledByStaffId(staffId: number): Promise<Commission[]> {
    return this.entityManager.find(Commission, {
      where: { staffId, settled: 0 },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 查詢指定日期範圍的佣金
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 佣金明細列表
   */
  async findByDateRange(
    shopId: number,
    startDate: Date,
    endDate: Date
  ): Promise<Commission[]> {
    return this.entityManager.find(Commission, {
      where: {
        shopId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 創建佣金明細
   *
   * @param commission - 佣金明細實體
   * @returns 創建後的佣金明細
   */
  async create(commission: Partial<Commission>): Promise<Commission> {
    const entity = this.entityManager.create(Commission, commission);
    return this.entityManager.save(entity);
  }

  /**
   * 批量創建佣金明細
   *
   * @param commissions - 佣金明細實體列表
   * @returns 創建後的佣金明細列表
   */
  async createBatch(commissions: Partial<Commission>[]): Promise<Commission[]> {
    const entities = this.entityManager.create(Commission, commissions);
    return this.entityManager.save(entities);
  }

  /**
   * 標記佣金為已結算
   *
   * @param ids - 佣金明細 ID 列表
   * @param settlementId - 結算 ID
   */
  async markAsSettled(ids: number[], settlementId: number): Promise<void> {
    await this.entityManager
      .createQueryBuilder()
      .update(Commission)
      .set({ settled: 1, settlementId })
      .where('id IN (:...ids)', { ids })
      .execute();
  }

  /**
   * 獲取美容師佣金統計
   *
   * @param staffId - 美容師 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 統計信息
   */
  async getStaffCommissionStats(
    staffId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCommission: number;
    totalBonus: number;
    totalDeduction: number;
  }> {
    const result = await this.entityManager
      .createQueryBuilder(Commission, 'commission')
      .select([
        "COALESCE(SUM(CASE WHEN commission.type IN ('service_commission', 'product_commission') THEN commission.amount ELSE 0 END), 0) AS totalCommission",
        "COALESCE(SUM(CASE WHEN commission.type = 'bonus' THEN commission.amount ELSE 0 END), 0) AS totalBonus",
        "COALESCE(SUM(CASE WHEN commission.type = 'deduction' THEN commission.amount ELSE 0 END), 0) AS totalDeduction",
      ])
      .where('commission.staffId = :staffId', { staffId })
      .andWhere('commission.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return {
      totalCommission: Number(result?.totalCommission || 0),
      totalBonus: Number(result?.totalBonus || 0),
      totalDeduction: Number(result?.totalDeduction || 0),
    };
  }
}
