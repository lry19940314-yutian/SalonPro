// ============================================================================
// 美業 SaaS 智慧管理系統 — 作品集 DAO
// ============================================================================
// 功能：作品集表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { Portfolio } from '../entity/Portfolio';

@Provide()
export class PortfolioDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢作品
   *
   * @param id - 作品 ID
   * @returns 作品實體或 null
   */
  async findById(id: number): Promise<Portfolio | null> {
    return this.entityManager.findOne(Portfolio, {
      where: { id },
    });
  }

  /**
   * 根據美容師 ID 查詢作品
   *
   * @param staffId - 美容師 ID
   * @returns 作品列表
   */
  async findByStaffId(staffId: number): Promise<Portfolio[]> {
    return this.entityManager.find(Portfolio, {
      where: { staffId },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 根據門店 ID 查詢作品
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 作品列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Portfolio[], number]> {
    return this.entityManager.findAndCount(Portfolio, {
      where: { shopId },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據媒體類型查詢
   *
   * @param shopId - 門店 ID
   * @param mediaType - 媒體類型
   * @returns 作品列表
   */
  async findByMediaType(shopId: number, mediaType: 'image' | 'video'): Promise<Portfolio[]> {
    return this.entityManager.find(Portfolio, {
      where: { shopId, mediaType },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 創建作品
   *
   * @param portfolio - 作品實體
   * @returns 創建後的作品
   */
  async create(portfolio: Partial<Portfolio>): Promise<Portfolio> {
    const entity = this.entityManager.create(Portfolio, portfolio);
    return this.entityManager.save(entity);
  }

  /**
   * 更新作品
   *
   * @param id - 作品 ID
   * @param data - 更新數據
   * @returns 更新後的作品
   */
  async update(id: number, data: Partial<Portfolio>): Promise<Portfolio | null> {
    await this.entityManager.update(Portfolio, id, data as any);
    return this.findById(id);
  }

  /**
   * 刪除作品
   *
   * @param id - 作品 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(Portfolio, id);
  }
}
