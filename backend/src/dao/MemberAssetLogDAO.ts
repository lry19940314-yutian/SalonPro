// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員資產變動記錄 DAO
// ============================================================================
// 功能：會員資產變動記錄表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, Between } from 'typeorm';
import { MemberAssetLog } from '../entity/MemberAssetLog';

@Provide()
export class MemberAssetLogDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢變動記錄
   *
   * @param id - 記錄 ID
   * @returns 變動記錄實體或 null
   */
  async findById(id: number): Promise<MemberAssetLog | null> {
    return this.entityManager.findOne(MemberAssetLog, {
      where: { id },
    });
  }

  /**
   * 根據資產 ID 查詢變動記錄
   *
   * @param assetId - 資產 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 變動記錄列表及總數
   */
  async findByAssetId(
    assetId: number,
    page = 1,
    pageSize = 20
  ): Promise<[MemberAssetLog[], number]> {
    return this.entityManager.findAndCount(MemberAssetLog, {
      where: { assetId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據會員 ID 查詢變動記錄
   *
   * @param memberId - 會員 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 變動記錄列表及總數
   */
  async findByMemberId(
    memberId: number,
    page = 1,
    pageSize = 20
  ): Promise<[MemberAssetLog[], number]> {
    return this.entityManager.findAndCount(MemberAssetLog, {
      where: { memberId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據時間範圍查詢變動記錄
   *
   * @param memberId - 會員 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 變動記錄列表
   */
  async findByDateRange(
    memberId: number,
    startDate: Date,
    endDate: Date
  ): Promise<MemberAssetLog[]> {
    return this.entityManager.find(MemberAssetLog, {
      where: {
        memberId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 創建變動記錄
   *
   * @param log - 變動記錄實體
   * @returns 創建後的變動記錄
   */
  async create(log: Partial<MemberAssetLog>): Promise<MemberAssetLog> {
    const entity = this.entityManager.create(MemberAssetLog, log);
    return this.entityManager.save(entity);
  }
}
