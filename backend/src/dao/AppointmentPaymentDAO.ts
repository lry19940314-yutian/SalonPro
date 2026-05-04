// ============================================================================
// 美業 SaaS 智慧管理系統 — 預約支付記錄 DAO
// ============================================================================
// 功能：預約支付記錄表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { AppointmentPayment } from '../entity/AppointmentPayment';

@Provide()
export class AppointmentPaymentDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢支付記錄
   *
   * @param id - 支付記錄 ID
   * @returns 支付記錄實體或 null
   */
  async findById(id: number): Promise<AppointmentPayment | null> {
    return this.entityManager.findOne(AppointmentPayment, {
      where: { id },
    });
  }

  /**
   * 根據支付單號查詢
   *
   * @param paymentNo - 支付單號
   * @returns 支付記錄實體或 null
   */
  async findByPaymentNo(paymentNo: string): Promise<AppointmentPayment | null> {
    return this.entityManager.findOne(AppointmentPayment, {
      where: { paymentNo },
    });
  }

  /**
   * 根據預約 ID 查詢所有支付記錄
   *
   * @param appointmentId - 預約 ID
   * @returns 支付記錄列表
   */
  async findByAppointmentId(appointmentId: number): Promise<AppointmentPayment[]> {
    return this.entityManager.find(AppointmentPayment, {
      where: { appointmentId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 創建支付記錄
   *
   * @param payment - 支付記錄實體
   * @returns 創建後的支付記錄
   */
  async create(payment: Partial<AppointmentPayment>): Promise<AppointmentPayment> {
    const entity = this.entityManager.create(AppointmentPayment, payment);
    return this.entityManager.save(entity);
  }

  /**
   * 更新支付狀態
   *
   * @param id - 支付記錄 ID
   * @param status - 支付狀態
   */
  async updateStatus(id: number, status: 'success' | 'failed' | 'refunded'): Promise<void> {
    await this.entityManager.update(AppointmentPayment, id, { status } as any);
  }

  /**
   * 退款處理
   *
   * @param id - 支付記錄 ID
   */
  async refund(id: number): Promise<void> {
    await this.entityManager.update(AppointmentPayment, id, {
      status: 'refunded',
    } as any);
  }
}
