// ============================================================================
// 美業 SaaS 智慧管理系統 — 票券定義服務
// ============================================================================
// 功能：優惠券/儲值卡/點數方案的 CRUD 業務邏輯
// ============================================================================

import { Provide } from '@midwayjs/core';
import { CouponDAO } from '../dao/CouponDAO';
import { MemberCouponDAO } from '../dao/MemberCouponDAO';
import { Coupon } from '../entity/Coupon';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class CouponService {
  constructor(
    private readonly couponDAO: CouponDAO,
    private readonly memberCouponDAO: MemberCouponDAO
  ) {}

  /**
   * 根據 ID 查詢票券定義
   */
  async findById(id: number): Promise<Coupon> {
    const coupon = await this.couponDAO.findById(id);
    if (!coupon) {
      throw new NotFoundError('票券不存在');
    }
    return coupon;
  }

  /**
   * 根據門店 ID 查詢所有票券定義
   */
  async findByShopId(shopId: number): Promise<Coupon[]> {
    return this.couponDAO.findByShopId(shopId);
  }

  /**
   * 查詢有效的票券定義
   */
  async findValid(shopId: number): Promise<Coupon[]> {
    return this.couponDAO.findValid(shopId);
  }

  /**
   * 創建票券定義
   */
  async create(data: {
    shopId: number;
    name: string;
    type: 'discount' | 'deduction' | 'gift';
    value: number;
    conditionAmount?: number;
    validDays?: number;
    validStart?: string;
    validEnd?: string;
    totalQuantity?: number;
    description?: string;
  }): Promise<Coupon> {
    return this.couponDAO.create(data);
  }

  /**
   * 更新票券定義
   */
  async update(id: number, data: Partial<Coupon>): Promise<Coupon> {
    await this.findById(id);
    const updated = await this.couponDAO.update(id, data);
    if (!updated) {
      throw new BusinessError('更新票券失敗');
    }
    return updated;
  }

  /**
   * 刪除票券定義
   */
  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.couponDAO.delete(id);
  }

  /**
   * 發放票券給會員
   */
  async issueToMember(couponId: number, memberId: number, quantity = 1): Promise<void> {
    const coupon = await this.findById(couponId);

    if (coupon.totalQuantity != null) {
      const issuedCount = await this.memberCouponDAO.countByCouponId(couponId);
      if (issuedCount + quantity > coupon.totalQuantity) {
        throw new BusinessError('票券庫存不足');
      }
    }

    const now = new Date();
    let expiryDate: string | undefined;

    if (coupon.validDays) {
      const exp = new Date(now);
      exp.setDate(exp.getDate() + coupon.validDays);
      expiryDate = exp.toISOString().slice(0, 19).replace('T', ' ');
    } else if (coupon.validEnd) {
      expiryDate = coupon.validEnd;
    }

    const records: Array<{
      couponId: number;
      memberId: number;
      code: string;
      status: 'unused';
      expiryDate?: string;
    }> = [];

    for (let i = 0; i < quantity; i++) {
      records.push({
        couponId,
        memberId,
        code: this.generateCouponCode(couponId, memberId, i),
        status: 'unused',
        expiryDate,
      });
    }

    await this.memberCouponDAO.createBatch(records);
  }

  /**
   * 生成票券碼
   */
  private generateCouponCode(couponId: number, memberId: number, index: number): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CP${timestamp}${random}${String(couponId).padStart(4, '0')}${String(memberId).padStart(6, '0')}${String(index).padStart(2, '0')}`;
  }
}
