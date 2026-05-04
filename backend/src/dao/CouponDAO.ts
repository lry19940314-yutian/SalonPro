// ============================================================================
// 美業 SaaS 智慧管理系統 — 優惠券定義 DAO
// ============================================================================
// 功能：優惠券定義表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, In } from 'typeorm';
import { Coupon } from '../entity/Coupon';

@Provide()
export class CouponDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢優惠券
   *
   * @param id - 優惠券 ID
   * @returns 優惠券實體或 null
   */
  async findById(id: number): Promise<Coupon | null> {
    return this.entityManager.findOne(Coupon, {
      where: { id },
    });
  }

  /**
   * 根據門店 ID 查詢所有優惠券
   *
   * @param shopId - 門店 ID
   * @returns 優惠券列表
   */
  async findByShopId(shopId: number): Promise<Coupon[]> {
    return this.entityManager.find(Coupon, {
      where: { shopId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根據 ID 列表批量查詢
   *
   * @param ids - 優惠券 ID 列表
   * @returns 優惠券列表
   */
  async findByIds(ids: number[]): Promise<Coupon[]> {
    return this.entityManager.find(Coupon, {
      where: { id: In(ids) },
    });
  }

  /**
   * 查詢當前有效的優惠券
   *
   * @param shopId - 門店 ID
   * @returns 優惠券列表
   */
  async findValid(shopId: number): Promise<Coupon[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.entityManager
      .createQueryBuilder(Coupon, 'coupon')
      .where('coupon.shopId = :shopId', { shopId })
      .andWhere('coupon.status = :status', { status: 1 })
      .andWhere('(coupon.validStart IS NULL OR coupon.validStart <= :today)', { today })
      .andWhere('(coupon.validEnd IS NULL OR coupon.validEnd >= :today)', { today })
      .orderBy('coupon.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 創建優惠券
   *
   * @param coupon - 優惠券實體
   * @returns 創建後的優惠券
   */
  async create(coupon: Partial<Coupon>): Promise<Coupon> {
    const entity = this.entityManager.create(Coupon, coupon);
    return this.entityManager.save(entity);
  }

  /**
   * 更新優惠券
   *
   * @param id - 優惠券 ID
   * @param data - 更新數據
   * @returns 更新後的優惠券
   */
  async update(id: number, data: Partial<Coupon>): Promise<Coupon | null> {
    await this.entityManager.update(Coupon, id, data as any);
    return this.findById(id);
  }

  /**
   * 刪除優惠券
   *
   * @param id - 優惠券 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(Coupon, id);
  }

  /**
   * 更新已發放數量
   *
   * @param id - 優惠券 ID
   */
  async incrementGivenQuantity(id: number): Promise<void> {
    await this.entityManager
      .createQueryBuilder()
      .update(Coupon)
      .set({ givenQuantity: () => 'given_quantity + 1' })
      .where('id = :id', { id })
      .andWhere('totalQuantity IS NULL OR given_quantity < total_quantity')
      .execute();
  }
}
