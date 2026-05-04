// ============================================================================
// 美業 SaaS 智慧管理系統 — 業績服務
// ============================================================================
// 功能：業績記錄查詢、統計、結算
// ============================================================================

import { Provide } from '@midwayjs/core';
import { PerformanceDAO } from '../dao/PerformanceDAO';
import { CommissionDAO } from '../dao/CommissionDAO';
import { Performance } from '../entity/Performance';
import { NotFoundError } from '../filter/exception';

@Provide()
export class PerformanceService {
  constructor(
    private readonly performanceDAO: PerformanceDAO,
    private readonly commissionDAO: CommissionDAO
  ) {}

  /**
   * 根據 ID 查詢業績記錄
   */
  async findById(id: number): Promise<Performance> {
    const perf = await this.performanceDAO.findById(id);
    if (!perf) {
      throw new NotFoundError('業績記錄不存在');
    }
    return perf;
  }

  /**
   * 根據美容師 ID 查詢業績
   */
  async findByStaffId(staffId: number, page = 1, pageSize = 20): Promise<{ items: Performance[]; total: number }> {
    const [items, total] = await this.performanceDAO.findByStaffId(staffId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據門店查詢業績
   */
  async findByShopId(shopId: number, page = 1, pageSize = 20): Promise<{ items: Performance[]; total: number }> {
    const [items, total] = await this.performanceDAO.findByShopId(shopId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據日期範圍查詢業績
   */
  async findByDateRange(shopId: number, startDate: string, endDate: string): Promise<Performance[]> {
    return this.performanceDAO.findByDateRange(shopId, startDate, endDate);
  }

  /**
   * 查詢美容師在指定日期範圍內的業績
   */
  async findByStaffIdAndDateRange(staffId: number, startDate: string, endDate: string): Promise<Performance[]> {
    return this.performanceDAO.findByStaffIdAndDateRange(staffId, startDate, endDate);
  }

  /**
   * 查詢未結算的業績
   */
  async findUnsettled(staffId: number): Promise<Performance[]> {
    return this.performanceDAO.findUnsettled(staffId);
  }

  /**
   * 獲取美容師業績統計
   */
  async getStaffPerformanceStats(staffId: number, startDate: string, endDate: string): Promise<{
    totalAmount: number;
    totalCommission: number;
    serviceCount: number;
    productCount: number;
  }> {
    return this.performanceDAO.getStaffPerformanceStats(staffId, startDate, endDate);
  }

  /**
   * 獲取門店業績統計
   */
  async getShopPerformanceStats(shopId: number, startDate: string, endDate: string): Promise<{
    totalAmount: number;
    totalCommission: number;
    totalCount: number;
  }> {
    return this.performanceDAO.getShopPerformanceStats(shopId, startDate, endDate);
  }
}
