// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員等級 DAO
// ============================================================================
// 功能：會員等級表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { MemberLevel } from '../entity/MemberLevel';

@Provide()
export class MemberLevelDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢會員等級
   *
   * @param id - 等級 ID
   * @returns 會員等級實體或 null
   */
  async findById(id: number): Promise<MemberLevel | null> {
    return this.entityManager.findOne(MemberLevel, {
      where: { id },
    });
  }

  /**
   * 根據門店 ID 查詢所有會員等級
   *
   * @param shopId - 門店 ID
   * @returns 會員等級列表
   */
  async findByShopId(shopId: number): Promise<MemberLevel[]> {
    return this.entityManager.find(MemberLevel, {
      where: { shopId },
      order: { level: 'ASC' },
    });
  }

  /**
   * 根據等級值查詢
   *
   * @param shopId - 門店 ID
   * @param level - 等級值
   * @returns 會員等級實體或 null
   */
  async findByLevel(shopId: number, level: number): Promise<MemberLevel | null> {
    return this.entityManager.findOne(MemberLevel, {
      where: { shopId, level },
    });
  }

  /**
   * 創建會員等級
   *
   * @param memberLevel - 會員等級實體
   * @returns 創建後的會員等級
   */
  async create(memberLevel: Partial<MemberLevel>): Promise<MemberLevel> {
    const entity = this.entityManager.create(MemberLevel, memberLevel);
    return this.entityManager.save(entity);
  }

  /**
   * 更新會員等級
   *
   * @param id - 等級 ID
   * @param data - 更新數據
   * @returns 更新後的會員等級
   */
  async update(id: number, data: Partial<MemberLevel>): Promise<MemberLevel | null> {
    await this.entityManager.update(MemberLevel, id, data as any);
    return this.findById(id);
  }

  /**
   * 刪除會員等級
   *
   * @param id - 等級 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(MemberLevel, id);
  }

  /**
   * 根據消費金額獲取匹配的會員等級
   *
   * @param shopId - 門店 ID
   * @param consumption - 消費金額
   * @returns 會員等級實體或 null
   */
  async findLevelByConsumption(shopId: number, consumption: number): Promise<MemberLevel | null> {
    return this.entityManager
      .createQueryBuilder(MemberLevel, 'level')
      .where('level.shopId = :shopId', { shopId })
      .andWhere('level.minConsumption <= :consumption', { consumption })
      .orderBy('level.level', 'DESC')
      .getOne();
  }
}
