// ============================================================================
// 美業 SaaS 智慧管理系統 — 預約服務
// ============================================================================
// 功能：預約管理、衝突檢測、狀態流轉、業績生成
// ============================================================================

import { Provide } from '@midwayjs/core';
import { AppointmentDAO } from '../dao/AppointmentDAO';
import { AppointmentItemDAO } from '../dao/AppointmentItemDAO';
import { AppointmentPaymentDAO } from '../dao/AppointmentPaymentDAO';
import { MemberDAO } from '../dao/MemberDAO';
import { StaffDAO } from '../dao/StaffDAO';
import { ScheduleDAO } from '../dao/ScheduleDAO';
import { PerformanceDAO } from '../dao/PerformanceDAO';
import { Appointment } from '../entity/Appointment';
import { AppointmentItem } from '../entity/AppointmentItem';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class AppointmentService {
  constructor(
    private readonly appointmentDAO: AppointmentDAO,
    private readonly appointmentItemDAO: AppointmentItemDAO,
    private readonly appointmentPaymentDAO: AppointmentPaymentDAO,
    private readonly memberDAO: MemberDAO,
    private readonly staffDAO: StaffDAO,
    private readonly scheduleDAO: ScheduleDAO,
    private readonly performanceDAO: PerformanceDAO
  ) {}

  /**
   * 根據 ID 查詢預約
   */
  async findById(id: number): Promise<Appointment> {
    const appointment = await this.appointmentDAO.findById(id);
    if (!appointment) {
      throw new NotFoundError('預約不存在');
    }
    return appointment;
  }

  /**
   * 根據訂單號查詢預約
   */
  async findByOrderNo(orderNo: string): Promise<Appointment> {
    const appointment = await this.appointmentDAO.findByOrderNo(orderNo);
    if (!appointment) {
      throw new NotFoundError('預約訂單不存在');
    }
    return appointment;
  }

  /**
   * 根據美容師和日期查詢預約
   */
  async findByStaffIdAndDate(staffId: number, date: string): Promise<Appointment[]> {
    return this.appointmentDAO.findByStaffIdAndDate(staffId, date);
  }

  /**
   * 根據會員 ID 查詢預約（分頁）
   */
  async findByMemberId(memberId: number, page = 1, pageSize = 20): Promise<{ items: Appointment[]; total: number }> {
    const [items, total] = await this.appointmentDAO.findByMemberId(memberId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據門店和日期範圍查詢預約
   */
  async findByDateRange(shopId: number, startDate: string, endDate: string): Promise<Appointment[]> {
    return this.appointmentDAO.findByDateRange(shopId, startDate, endDate);
  }

  /**
   * 根據狀態查詢預約（分頁）
   */
  async findByStatus(shopId: number, status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show', page = 1, pageSize = 20): Promise<{ items: Appointment[]; total: number }> {
    const [items, total] = await this.appointmentDAO.findByStatus(shopId, status, page, pageSize);
    return { items, total };
  }

  /**
   * 創建預約
   */
  async create(data: {
    shopId: number;
    memberId: number;
    staffId: number;
    scheduleId: number;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    items: Array<{
      itemType: 'service' | 'product';
      serviceId?: number;
      productId?: number;
      name: string;
      quantity: number;
      unitPrice: number;
      duration?: number;
      staffId?: number;
    }>;
    totalAmount: number;
    discountAmount?: number;
    finalAmount: number;
    paymentMethod?: string;
    remark?: string;
  }): Promise<Appointment> {
    // 驗證會員存在
    const member = await this.memberDAO.findById(data.memberId);
    if (!member) {
      throw new NotFoundError('會員不存在');
    }

    // 驗證美容師存在
    const staff = await this.staffDAO.findById(data.staffId);
    if (!staff) {
      throw new NotFoundError('美容師不存在');
    }

    // 檢查時間衝突
    const hasConflict = await this.appointmentDAO.checkTimeConflict(
      data.staffId, data.appointmentDate, data.startTime, data.endTime
    );
    if (hasConflict) {
      throw new BusinessError('該時段已被預約，請選擇其他時間');
    }

    // 生成訂單號
    const orderNo = await this.generateOrderNo(data.shopId);

    // 創建預約
    const appointment = await this.appointmentDAO.create({
      shopId: data.shopId,
      memberId: data.memberId,
      staffId: data.staffId,
      scheduleId: data.scheduleId,
      orderNo,
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime: data.endTime,
      totalAmount: data.totalAmount,
      discountAmount: data.discountAmount || 0,
      finalAmount: data.finalAmount,
      paymentMethod: data.paymentMethod,
      status: 'pending',
      remark: data.remark,
    });

    // 創建預約項目
    const items = data.items.map(item => ({
      appointmentId: appointment.id,
      itemType: item.itemType,
      serviceId: item.serviceId,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
      duration: item.duration,
      staffId: item.staffId || data.staffId,
    }));
    await this.appointmentItemDAO.createBatch(items);

    // 將排班標記為忙碌
    await this.scheduleDAO.update(data.scheduleId, { status: 'busy' } as any);

    return appointment;
  }

  /**
   * 確認預約
   */
  async confirm(id: number): Promise<Appointment> {
    const appointment = await this.findById(id);
    if (appointment.status !== 'pending') {
      throw new BusinessError('只有待確認的預約才能確認');
    }
    const updated = await this.appointmentDAO.update(id, { status: 'confirmed' });
    if (!updated) throw new BusinessError('確認預約失敗');
    return updated;
  }

  /**
   * 開始服務
   */
  async startService(id: number): Promise<Appointment> {
    const appointment = await this.findById(id);
    if (appointment.status !== 'confirmed') {
      throw new BusinessError('只有已確認的預約才能開始服務');
    }
    const updated = await this.appointmentDAO.update(id, { status: 'in_progress' });
    if (!updated) throw new BusinessError('更新預約狀態失敗');
    return updated;
  }

  /**
   * 完成預約
   */
  async complete(id: number): Promise<Appointment> {
    const appointment = await this.findById(id);
    if (appointment.status !== 'in_progress') {
      throw new BusinessError('只有服務中的預約才能完成');
    }

    const updated = await this.appointmentDAO.complete(id);

    // 生成業績記錄
    await this.generatePerformance(appointment);

    // 更新會員消費統計
    const member = await this.memberDAO.findById(appointment.memberId);
    if (member) {
      await this.memberDAO.updateConsumption(
        appointment.memberId,
        appointment.finalAmount
      );
    }

    // 將排班恢復為可用
    await this.scheduleDAO.update(appointment.scheduleId, { status: 'available' } as any);

    return this.findById(id);
  }

  /**
   * 取消預約
   */
  async cancel(id: number, reason?: string): Promise<Appointment> {
    const appointment = await this.findById(id);
    if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
      throw new BusinessError('該預約無法取消');
    }

    const updated = await this.appointmentDAO.cancel(id, reason);

    // 將排班恢復為可用
    await this.scheduleDAO.update(appointment.scheduleId, { status: 'available' } as any);

    return this.findById(id);
  }

  /**
   * 標記為未到
   */
  async markNoShow(id: number): Promise<Appointment> {
    const appointment = await this.findById(id);
    if (appointment.status !== 'confirmed' && appointment.status !== 'pending') {
      throw new BusinessError('只有待確認或已確認的預約才能標記為未到');
    }

    const updated = await this.appointmentDAO.update(id, { status: 'no_show' });
    if (!updated) throw new BusinessError('更新預約狀態失敗');

    // 將排班恢復為可用
    await this.scheduleDAO.update(appointment.scheduleId, { status: 'available' } as any);

    return updated;
  }

  /**
   * 獲取預約項目
   */
  async getItems(appointmentId: number): Promise<AppointmentItem[]> {
    return this.appointmentItemDAO.findByAppointmentId(appointmentId);
  }

  /**
   * 獲取每日統計
   */
  async getDailyStats(shopId: number, date: string): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    revenue: number;
  }> {
    return this.appointmentDAO.getDailyStats(shopId, date);
  }

  /**
   * 生成業績記錄
   */
  private async generatePerformance(appointment: Appointment): Promise<void> {
    const items = await this.appointmentItemDAO.findByAppointmentId(appointment.id);

    for (const item of items) {
      await this.performanceDAO.create({
        staffId: item.staffId || appointment.staffId,
        appointmentId: appointment.id,
        type: item.itemType,
        itemName: item.name,
        quantity: item.quantity,
        amount: item.subtotal,
        performanceDate: appointment.appointmentDate,
        settled: 0,
      });
    }
  }

  /**
   * 生成訂單號
   */
  private async generateOrderNo(shopId: number): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `AP${dateStr}${timeStr}${random}${String(shopId).padStart(3, '0')}`;
  }
}
