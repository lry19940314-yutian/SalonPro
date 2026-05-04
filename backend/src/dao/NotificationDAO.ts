// ============================================================================
// 美業 SaaS 智慧管理系統 — 通知 DAO
// ============================================================================
// 功能：通知表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { Notification } from '../entity/Notification';

@Provide()
export class NotificationDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢通知
   *
   * @param id - 通知 ID
   * @returns 通知實體或 null
   */
  async findById(id: number): Promise<Notification | null> {
    return this.entityManager.findOne(Notification, {
      where: { id },
    });
  }

  /**
   * 根據門店 ID 查詢通知
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 通知列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Notification[], number]> {
    return this.entityManager.findAndCount(Notification, {
      where: { shopId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據接收者類型查詢
   *
   * @param shopId - 門店 ID
   * @param receiverType - 接收者類型
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 通知列表及總數
   */
  async findByReceiverType(
    shopId: number,
    receiverType: 'staff' | 'member' | 'all',
    page = 1,
    pageSize = 20
  ): Promise<[Notification[], number]> {
    return this.entityManager.findAndCount(Notification, {
      where: { shopId, receiverType },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據狀態查詢
   *
   * @param shopId - 門店 ID
   * @param status - 發送狀態
   * @returns 通知列表
   */
  async findByStatus(
    shopId: number,
    status: 'pending' | 'sent' | 'failed'
  ): Promise<Notification[]> {
    return this.entityManager.find(Notification, {
      where: { shopId, status },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 創建通知
   *
   * @param notification - 通知實體
   * @returns 創建後的通知
   */
  async create(notification: Partial<Notification>): Promise<Notification> {
    const entity = this.entityManager.create(Notification, notification);
    return this.entityManager.save(entity);
  }

  /**
   * 批量創建通知
   *
   * @param notifications - 通知實體列表
   * @returns 創建後的通知列表
   */
  async createBatch(notifications: Partial<Notification>[]): Promise<Notification[]> {
    const entities = this.entityManager.create(Notification, notifications);
    return this.entityManager.save(entities);
  }

  /**
   * 更新通知狀態
   *
   * @param id - 通知 ID
   * @param status - 發送狀態
   */
  async updateStatus(id: number, status: 'pending' | 'sent' | 'failed'): Promise<void> {
    await this.entityManager.update(Notification, id, { status } as any);
  }

  /**
   * 刪除通知
   *
   * @param id - 通知 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(Notification, id);
  }
}
