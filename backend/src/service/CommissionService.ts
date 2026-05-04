// ============================================================================
// 美業 SaaS 智慧管理系統 — 佣金服務
// ============================================================================
// 功能：佣金記錄查詢、結算
// ============================================================================

import { Provide } from '@midwayjs/core';
import { CommissionDAO } from '../dao/CommissionDAO';
import { Commission } from '../entity/Commission';
import { NotFoundError } from '../filter/exception';

@Provide()
export class CommissionService {
  constructor(
    private readonly commissionDAO: CommissionDAO
  ) {}

  /**
   * 根據 ID 查詢佣金記錄
   */
  async findById(id: number): Promise<Commission> {
    const commission = await this.commissionDAO.findById(id);
    if (!commission) {
      throw new NotFoundError('佣金記錄不存在');
    }
    return commission;
  }

  /**
   * 根據美容師 ID 查詢佣金
   */
  async findByStaffId(staffId: number, page = 1, pageSize = 20): Promise<{ items: Commission[]; total: number }> {
    const [items, total] = await this.commissionDAO.findByStaffId(staffId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據門店查詢佣金
   */
  async findByShopId(shopId: number, page = 1, pageSize = 20): Promise<{ items: Commission[]; total: number }> {
    const [items, total] = await this.commissionDAO.findByShopId(shopId, page, pageSize);
    return { items, total };
  }

  /**
   * 查詢未結算佣金
   */
  async findUnsettledByStaffId(staffId: number): Promise<Commission[]> {
    return this.commissionDAO.findUnsettledByStaffId(staffId);
  }

  /**
   * 獲取美容師佣金統計
   */
  async getStaffCommissionStats(staffId: number, startDate: Date, endDate: Date): Promise<{
    totalCommission: number;
    totalBonus: number;
    totalDeduction: number;
  }> {
    return this.commissionDAO.getStaffCommissionStats(staffId, startDate, endDate);
  }
}
