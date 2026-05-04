// ============================================================================
// 美業 SaaS 智慧管理系統 — 佣金結算服務
// ============================================================================
// 功能：佣金結算管理、結算確認、付款
// ============================================================================

import { Provide } from '@midwayjs/core';
import { CommissionSettlementDAO } from '../dao/CommissionSettlementDAO';
import { CommissionDAO } from '../dao/CommissionDAO';
import { CommissionSettlement } from '../entity/CommissionSettlement';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class CommissionSettlementService {
  constructor(
    private readonly commissionSettlementDAO: CommissionSettlementDAO,
    private readonly commissionDAO: CommissionDAO
  ) {}

  /**
   * 根據 ID 查詢結算記錄
   */
  async findById(id: number): Promise<CommissionSettlement> {
    const settlement = await this.commissionSettlementDAO.findById(id);
    if (!settlement) {
      throw new NotFoundError('結算記錄不存在');
    }
    return settlement;
  }

  /**
   * 根據門店查詢結算記錄
   */
  async findByShopId(shopId: number, page = 1, pageSize = 20): Promise<{ items: CommissionSettlement[]; total: number }> {
    const [items, total] = await this.commissionSettlementDAO.findByShopId(shopId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據狀態查詢結算記錄
   */
  async findByStatus(shopId: number, status: 'pending' | 'confirmed' | 'paid'): Promise<CommissionSettlement[]> {
    return this.commissionSettlementDAO.findByStatus(shopId, status);
  }

  /**
   * 創建結算
   */
  async create(data: {
    shopId: number;
    staffId: number;
    periodStart: string;
    periodEnd: string;
    commissionIds: number[];
    bonusAmount?: number;
    deductionAmount?: number;
    bonusDescription?: string;
    deductionDescription?: string;
  }): Promise<CommissionSettlement> {
    // 計算佣金總額
    const commissions = await this.commissionDAO.findUnsettledByStaffId(data.staffId);
    const totalCommission = commissions
      .filter(c => data.commissionIds.includes(c.id))
      .reduce((sum, c) => sum + c.amount, 0);

    const totalBonus = data.bonusAmount || 0;
    const totalDeduction = data.deductionAmount || 0;
    const netAmount = totalCommission + totalBonus - totalDeduction;

    // 創建結算記錄
    const settlement = await this.commissionSettlementDAO.create({
      shopId: data.shopId,
      staffId: data.staffId,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      totalCommission,
      totalBonus,
      totalDeduction,
      netAmount,
      status: 'pending',
    });

    // 標記佣金為已結算
    await this.commissionDAO.markAsSettled(data.commissionIds, settlement.id);

    return settlement;
  }

  /**
   * 確認結算
   */
  async confirm(id: number): Promise<CommissionSettlement> {
    const settlement = await this.findById(id);
    if (settlement.status !== 'pending') {
      throw new BusinessError('只有待確認的結算才能確認');
    }
    await this.commissionSettlementDAO.confirm(id);
    return this.findById(id);
  }

  /**
   * 標記為已付款
   */
  async markAsPaid(id: number): Promise<CommissionSettlement> {
    const settlement = await this.findById(id);
    if (settlement.status !== 'confirmed') {
      throw new BusinessError('只有已確認的結算才能付款');
    }
    await this.commissionSettlementDAO.markAsPaid(id);
    return this.findById(id);
  }

  /**
   * 刪除結算記錄
   */
  async delete(id: number): Promise<void> {
    const settlement = await this.findById(id);
    if (settlement.status !== 'pending') {
      throw new BusinessError('已確認或已付款的結算無法刪除');
    }
    // 軟刪除：將狀態重置為 pending
    await this.commissionSettlementDAO.update(id, { status: 'pending' } as any);
  }
}
