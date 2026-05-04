// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員資產 DAO
// ============================================================================
// 功能：會員資產表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { MemberAsset } from '../entity/MemberAsset';

@Provide()
export class MemberAssetDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢會員資產
   *
   * @param id - 資產 ID
   * @returns 會員資產實體或 null
   */
  async findById(id: number): Promise<MemberAsset | null> {
    return this.entityManager.findOne(MemberAsset, {
      where: { id },
    });
  }

  /**
   * 根據會員 ID 查詢所有資產
   *
   * @param memberId - 會員 ID
   * @returns 會員資產列表
   */
  async findByMemberId(memberId: number): Promise<MemberAsset[]> {
    return this.entityManager.find(MemberAsset, {
      where: { memberId },
    });
  }

  /**
   * 根據會員 ID 和資產類型查詢
   *
   * @param memberId - 會員 ID
   * @param assetType - 資產類型
   * @returns 會員資產實體或 null
   */
  async findByMemberIdAndType(memberId: number, assetType: 'balance' | 'course' | 'points' | 'coupon'): Promise<MemberAsset | null> {
    return this.entityManager.findOne(MemberAsset, {
      where: { memberId, assetType },
    });
  }

  /**
   * 創建會員資產
   *
   * @param asset - 會員資產實體
   * @returns 創建後的會員資產
   */
  async create(asset: Partial<MemberAsset>): Promise<MemberAsset> {
    const entity = this.entityManager.create(MemberAsset, asset);
    return this.entityManager.save(entity);
  }

  /**
   * 更新會員資產
   *
   * @param id - 資產 ID
   * @param data - 更新數據
   * @returns 更新後的會員資產
   */
  async update(id: number, data: Partial<MemberAsset>): Promise<MemberAsset | null> {
    await this.entityManager.update(MemberAsset, id, data as any);
    return this.findById(id);
  }

  /**
   * 增減資產數量（原子操作）
   *
   * @param id - 資產 ID
   * @param quantity - 增減數量（正數增加，負數減少）
   */
  async updateQuantity(id: number, quantity: number): Promise<void> {
    await this.entityManager
      .createQueryBuilder()
      .update(MemberAsset)
      .set({
        usedQuantity: () => `used_quantity + ${Math.abs(quantity)}`,
      })
      .where('id = :id', { id })
      .andWhere(`(${quantity > 0 ? 'total_quantity' : 'used_quantity'}) + ${quantity} >= 0`)
      .execute();
  }

  /**
   * 獲取會員資產總覽
   *
   * @param memberId - 會員 ID
   * @returns 資產匯總
   */
  async getAssetSummary(memberId: number): Promise<{
    balance: number;
    points: number;
    courses: { id: number; name: string; total: number; used: number }[];
    coupons: number;
  }> {
    const assets = await this.findByMemberId(memberId);
    const summary = {
      balance: 0,
      points: 0,
      courses: [] as { id: number; name: string; total: number; used: number }[],
      coupons: 0,
    };

    for (const asset of assets) {
      switch (asset.assetType) {
        case 'balance':
          summary.balance = asset.totalQuantity - asset.usedQuantity;
          break;
        case 'points':
          summary.points = asset.totalQuantity - asset.usedQuantity;
          break;
        case 'course':
          summary.courses.push({
            id: asset.id,
            name: asset.remark || '',
            total: asset.totalQuantity,
            used: asset.usedQuantity,
          });
          break;
        case 'coupon':
          summary.coupons = asset.totalQuantity - asset.usedQuantity;
          break;
      }
    }

    return summary;
  }
}
