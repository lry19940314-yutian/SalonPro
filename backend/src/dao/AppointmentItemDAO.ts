// ============================================================================
// 美業 SaaS 智慧管理系統 — 預約明細 DAO
// ============================================================================
// 功能：預約明細表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { AppointmentItem } from '../entity/AppointmentItem';

@Provide()
export class AppointmentItemDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢預約明細
   *
   * @param id - 明細 ID
   * @returns 預約明細實體或 null
   */
  async findById(id: number): Promise<AppointmentItem | null> {
    return this.entityManager.findOne(AppointmentItem, {
      where: { id },
    });
  }

  /**
   * 根據預約 ID 查詢所有明細
   *
   * @param appointmentId - 預約 ID
   * @returns 預約明細列表
   */
  async findByAppointmentId(appointmentId: number): Promise<AppointmentItem[]> {
    return this.entityManager.find(AppointmentItem, {
      where: { appointmentId },
      order: { id: 'ASC' },
    });
  }

  /**
   * 批量創建預約明細
   *
   * @param items - 預約明細實體列表
   * @returns 創建後的預約明細列表
   */
  async createBatch(items: Partial<AppointmentItem>[]): Promise<AppointmentItem[]> {
    const entities = this.entityManager.create(AppointmentItem, items);
    return this.entityManager.save(entities);
  }

  /**
   * 刪除預約明細
   *
   * @param id - 明細 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(AppointmentItem, id);
  }

  /**
   * 根據預約 ID 刪除所有明細
   *
   * @param appointmentId - 預約 ID
   */
  async deleteByAppointmentId(appointmentId: number): Promise<void> {
    await this.entityManager.delete(AppointmentItem, { appointmentId });
  }
}
