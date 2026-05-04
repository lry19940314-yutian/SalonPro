// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員票券服務
// ============================================================================
// 功能：會員持有的票券查詢、使用、過期處理
// ============================================================================

import { Provide } from '@midwayjs/core';
import { MemberCouponDAO } from '../dao/MemberCouponDAO';
import { CouponDAO } from '../dao/CouponDAO';
import { MemberCoupon } from '../entity/MemberCoupon';
import { NotFoundError, BusinessError } from '../filter/exception';

@Provide()
export class MemberCouponService {
  constructor(
    private readonly memberCouponDAO: MemberCouponDAO,
    private readonly couponDAO: CouponDAO
  ) {}

  /**
   * 根據 ID 查詢會員票券
   */
  async findById(id: number): Promise<MemberCoupon> {
    const mc = await this.memberCouponDAO.findById(id);
    if (!mc) {
      throw new NotFoundError('會員票券不存在');
    }
    return mc;
  }

  /**
   * 根據會員 ID 查詢所有票券
   */
  async findByMemberId(memberId: number): Promise<MemberCoupon[]> {
    return this.memberCouponDAO.findByMemberId(memberId);
  }

  /**
   * 查詢會員可用票券
   */
  async findValidByMemberId(memberId: number): Promise<MemberCoupon[]> {
    return this.memberCouponDAO.findValidByMemberId(memberId);
  }

  /**
   * 根據優惠券編號查詢
   */
  async findByCode(code: string): Promise<MemberCoupon> {
    const mc = await this.memberCouponDAO.findByCode(code);
    if (!mc) {
      throw new NotFoundError('票券編號不存在');
    }
    return mc;
  }

  /**
   * 使用票券
   */
  async use(id: number, appointmentId: number): Promise<void> {
    const mc = await this.findById(id);
    if (mc.status !== 'unused') {
      throw new BusinessError('該票券已使用或已過期');
    }
    if (mc.expiryDate && new Date(mc.expiryDate) < new Date()) {
      throw new BusinessError('該票券已過期');
    }
    await this.memberCouponDAO.use(id, appointmentId);
  }

  /**
   * 取消使用票券
   */
  async cancelUse(id: number): Promise<void> {
    const mc = await this.findById(id);
    if (mc.status !== 'used') {
      throw new BusinessError('該票券未使用，無需取消');
    }
    await this.memberCouponDAO.cancelUse(id);
  }

  /**
   * 手動標記過期
   */
  async markExpired(): Promise<number> {
    return this.memberCouponDAO.markExpired();
  }
}
