// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員優惠券 DAO
// ============================================================================
// 功能：會員優惠券表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { MemberCoupon } from '../entity/MemberCoupon';

@Provide()
export class MemberCouponDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢會員優惠券
   *
   * @param id - 會員優惠券 ID
   * @returns 會員優惠券實體或 null
   */
  async findById(id: number): Promise<MemberCoupon | null> {
    return this.entityManager.findOne(MemberCoupon, {
      where: { id },
    });
  }

  /**
   * 根據會員 ID 查詢所有優惠券
   *
   * @param memberId - 會員 ID
   * @returns 會員優惠券列表
   */
  async findByMemberId(memberId: number): Promise<MemberCoupon[]> {
    return this.entityManager.find(MemberCoupon, {
      where: { memberId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根據會員 ID 查詢可用優惠券
   *
   * @param memberId - 會員 ID
   * @returns 會員優惠券列表
   */
  async findValidByMemberId(memberId: number): Promise<MemberCoupon[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.entityManager
      .createQueryBuilder(MemberCoupon, 'mc')
      .where('mc.memberId = :memberId', { memberId })
      .andWhere('mc.status = :status', { status: 'unused' })
      .andWhere('(mc.expiryDate IS NULL OR mc.expiryDate >= :today)', { today })
      .orderBy('mc.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 根據優惠券編號查詢
   *
   * @param code - 優惠券編號
   * @returns 會員優惠券實體或 null
   */
  async findByCode(code: string): Promise<MemberCoupon | null> {
    return this.entityManager.findOne(MemberCoupon, {
      where: { code },
    });
  }

  /**
   * 根據預約 ID 查詢使用的優惠券
   *
   * @param appointmentId - 預約 ID
   * @returns 會員優惠券列表
   */
  async findByAppointmentId(appointmentId: number): Promise<MemberCoupon[]> {
    return this.entityManager.find(MemberCoupon, {
      where: { appointmentId },
    });
  }

  /**
   * 創建會員優惠券
   *
   * @param memberCoupon - 會員優惠券實體
   * @returns 創建後的會員優惠券
   */
  async create(memberCoupon: Partial<MemberCoupon>): Promise<MemberCoupon> {
    const entity = this.entityManager.create(MemberCoupon, memberCoupon);
    return this.entityManager.save(entity);
  }

  /**
   * 批量創建會員優惠券
   *
   * @param memberCoupons - 會員優惠券實體列表
   * @returns 創建後的會員優惠券列表
   */
  async createBatch(memberCoupons: Partial<MemberCoupon>[]): Promise<MemberCoupon[]> {
    const entities = this.entityManager.create(MemberCoupon, memberCoupons);
    return this.entityManager.save(entities);
  }

  /**
   * 使用優惠券
   *
   * @param id - 會員優惠券 ID
   * @param appointmentId - 預約 ID
   */
  async use(id: number, appointmentId: number): Promise<void> {
    await this.entityManager.update(MemberCoupon, id, {
      status: 'used',
      usedAt: new Date(),
      appointmentId,
    });
  }

  /**
   * 取消使用優惠券
   *
   * @param id - 會員優惠券 ID
   */
  async cancelUse(id: number): Promise<void> {
    await this.entityManager.update(MemberCoupon, id, {
      status: 'unused',
      usedAt: null as any,
      appointmentId: null as any,
    });
  }

  /**
   * 將過期優惠券標記為已過期
   */
  async markExpired(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.entityManager
      .createQueryBuilder()
      .update(MemberCoupon)
      .set({ status: 'expired' })
      .where('status = :status', { status: 'unused' })
      .andWhere('expiryDate IS NOT NULL AND expiryDate < :today', { today })
      .execute();
    return result.affected || 0;
  }

  /**
   * 根據票券定義 ID 統計已發放數量
   *
   * @param couponId - 票券定義 ID
   * @returns 已發放數量
   */
  async countByCouponId(couponId: number): Promise<number> {
    return this.entityManager.count(MemberCoupon, {
      where: { couponId },
    });
  }
}
