// ============================================================================
// 美業 SaaS 智慧管理系統 — 操作日誌 DAO
// ============================================================================
// 功能：操作日誌表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, Between } from 'typeorm';
import { OperationLog } from '../entity/OperationLog';

@Provide()
export class OperationLogDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢操作日誌
   *
   * @param id - 日誌 ID
   * @returns 操作日誌實體或 null
   */
  async findById(id: number): Promise<OperationLog | null> {
    return this.entityManager.findOne(OperationLog, {
      where: { id },
    });
  }

  /**
   * 根據門店 ID 查詢操作日誌
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 操作日誌列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[OperationLog[], number]> {
    return this.entityManager.findAndCount(OperationLog, {
      where: { shopId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據操作人員 ID 查詢
   *
   * @param staffId - 操作人員 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 操作日誌列表及總數
   */
  async findByStaffId(
    staffId: number,
    page = 1,
    pageSize = 20
  ): Promise<[OperationLog[], number]> {
    return this.entityManager.findAndCount(OperationLog, {
      where: { staffId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據模塊查詢
   *
   * @param shopId - 門店 ID
   * @param module - 模塊名稱
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 操作日誌列表及總數
   */
  async findByModule(
    shopId: number,
    module: string,
    page = 1,
    pageSize = 20
  ): Promise<[OperationLog[], number]> {
    return this.entityManager.findAndCount(OperationLog, {
      where: { shopId, module },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據時間範圍查詢
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 操作日誌列表
   */
  async findByDateRange(
    shopId: number,
    startDate: Date,
    endDate: Date
  ): Promise<OperationLog[]> {
    return this.entityManager.find(OperationLog, {
      where: {
        shopId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 創建操作日誌
   *
   * @param log - 操作日誌實體
   * @returns 創建後的操作日誌
   */
  async create(log: Partial<OperationLog>): Promise<OperationLog> {
    const entity = this.entityManager.create(OperationLog, log);
    return this.entityManager.save(entity);
  }

  /**
   * 批量創建操作日誌
   *
   * @param logs - 操作日誌實體列表
   * @returns 創建後的操作日誌列表
   */
  async createBatch(logs: Partial<OperationLog>[]): Promise<OperationLog[]> {
    const entities = this.entityManager.create(OperationLog, logs);
    return this.entityManager.save(entities);
  }

  /**
   * 清理指定日期之前的日誌
   *
   * @param beforeDate - 清理日期
   * @returns 刪除的記錄數
   */
  async cleanBefore(beforeDate: Date): Promise<number> {
    const result = await this.entityManager
      .createQueryBuilder()
      .delete()
      .from(OperationLog)
      .where('createdAt < :beforeDate', { beforeDate })
      .execute();
    return result.affected || 0;
  }
}
