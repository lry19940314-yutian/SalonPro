// ============================================================================
// 美業 SaaS 智慧管理系統 — 通知服務
// ============================================================================
// 功能：通知管理、發送記錄
// ============================================================================

import { Provide } from '@midwayjs/core';
import { NotificationDAO } from '../dao/NotificationDAO';
import { Notification } from '../entity/Notification';
import { NotFoundError } from '../filter/exception';

@Provide()
export class NotificationService {
  constructor(
    private readonly notificationDAO: NotificationDAO
  ) {}

  /**
   * 根據 ID 查詢通知
   */
  async findById(id: number): Promise<Notification> {
    const notification = await this.notificationDAO.findById(id);
    if (!notification) {
      throw new NotFoundError('通知不存在');
    }
    return notification;
  }

  /**
   * 根據門店查詢通知
   */
  async findByShopId(shopId: number, page = 1, pageSize = 20): Promise<{ items: Notification[]; total: number }> {
    const [items, total] = await this.notificationDAO.findByShopId(shopId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據接收類型查詢（分頁）
   */
  async findByReceiverType(shopId: number, receiverType: 'staff' | 'member' | 'all', page = 1, pageSize = 20): Promise<{ items: Notification[]; total: number }> {
    const [items, total] = await this.notificationDAO.findByReceiverType(shopId, receiverType, page, pageSize);
    return { items, total };
  }

  /**
   * 根據發送狀態查詢
   */
  async findByStatus(shopId: number, status: 'pending' | 'sent' | 'failed'): Promise<Notification[]> {
    return this.notificationDAO.findByStatus(shopId, status);
  }

  /**
   * 創建通知
   */
  async create(data: {
    shopId: number;
    type: 'appointment_reminder' | 'appointment_completed' | 'system_alert' | 'marketing' | 'leave_approval' | 'pick_approval';
    title: string;
    content: string;
    receiverType: 'staff' | 'member' | 'all';
    channel: 'in_app' | 'sms' | 'push';
  }): Promise<Notification> {
    return this.notificationDAO.create(data);
  }

  /**
   * 批量創建通知
   */
  async createBatch(notifications: Array<{
    shopId: number;
    type: 'appointment_reminder' | 'appointment_completed' | 'system_alert' | 'marketing' | 'leave_approval' | 'pick_approval';
    title: string;
    content: string;
    receiverType: 'staff' | 'member' | 'all';
    channel: 'in_app' | 'sms' | 'push';
  }>): Promise<Notification[]> {
    return this.notificationDAO.createBatch(notifications);
  }

  /**
   * 更新通知狀態
   */
  async updateStatus(id: number, status: 'pending' | 'sent' | 'failed'): Promise<Notification> {
    await this.findById(id);
    const updated = await this.notificationDAO.updateStatus(id, status);
    return this.findById(id);
  }
}
