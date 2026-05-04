// ============================================================================
// 美業 SaaS 智慧管理系統 — 請假服務
// ============================================================================
// 功能：請假申請、審批、衝突檢測
// ============================================================================

import { Provide } from '@midwayjs/core';
import { LeaveDAO } from '../dao/LeaveDAO';
import { ScheduleDAO } from '../dao/ScheduleDAO';
import { StaffDAO } from '../dao/StaffDAO';
import { Leave } from '../entity/Leave';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class LeaveService {
  constructor(
    private readonly leaveDAO: LeaveDAO,
    private readonly scheduleDAO: ScheduleDAO,
    private readonly staffDAO: StaffDAO
  ) {}

  /**
   * 根據 ID 查詢請假記錄
   */
  async findById(id: number): Promise<Leave> {
    const leave = await this.leaveDAO.findById(id);
    if (!leave) {
      throw new NotFoundError('請假記錄不存在');
    }
    return leave;
  }

  /**
   * 根據美容師 ID 查詢請假記錄（分頁）
   */
  async findByStaffId(staffId: number, page = 1, pageSize = 20): Promise<{ items: Leave[]; total: number }> {
    const [items, total] = await this.leaveDAO.findByStaffId(staffId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據門店查詢請假記錄（分頁）
   */
  async findByShopId(shopId: number, page = 1, pageSize = 20): Promise<{ items: Leave[]; total: number }> {
    const [items, total] = await this.leaveDAO.findByShopId(shopId, page, pageSize);
    return { items, total };
  }

  /**
   * 查詢待審批的請假記錄
   */
  async findPending(shopId: number): Promise<Leave[]> {
    return this.leaveDAO.findPending(shopId);
  }

  /**
   * 創建請假申請
   */
  async create(data: {
    staffId: number;
    type: 'annual' | 'sick' | 'personal' | 'other';
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<Leave> {
    // 驗證美容師存在
    const staff = await this.staffDAO.findById(data.staffId);
    if (!staff) {
      throw new NotFoundError('美容師不存在');
    }

    // 檢查請假日期範圍內的排班衝突
    const hasConflict = await this.leaveDAO.checkConflict(
      data.staffId, data.startDate, data.endDate
    );
    if (hasConflict) {
      throw new BusinessError('該日期範圍內已有請假記錄');
    }

    return this.leaveDAO.create({
      staffId: data.staffId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: 'pending',
    });
  }

  /**
   * 審批請假
   */
  async approve(id: number, approvedBy: number, status: 'approved' | 'rejected', remark?: string): Promise<Leave> {
    const leave = await this.findById(id);
    if (leave.status !== 'pending') {
      throw new BusinessError('該請假記錄已審批，無法重複操作');
    }

    await this.leaveDAO.approve(id, status, approvedBy);

    // 如果請假通過，將對應排班標記為休息
    if (status === 'approved') {
      const currentDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().slice(0, 10);
        const schedules = await this.scheduleDAO.findByStaffId(leave.staffId, dateStr, dateStr);

        for (const schedule of schedules) {
          await this.scheduleDAO.update(schedule.id, {
            isOff: 1,
            status: 'off',
            leaveId: id,
          } as any);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return this.findById(id);
  }

  /**
   * 更新請假記錄
   */
  async update(id: number, data: Partial<Leave>): Promise<Leave> {
    const leave = await this.findById(id);
    if (leave.status !== 'pending') {
      throw new BusinessError('已審批的請假記錄無法修改');
    }

    const updated = await this.leaveDAO.update(id, data);
    if (!updated) {
      throw new BusinessError('更新請假記錄失敗');
    }
    return updated;
  }

  /**
   * 刪除請假記錄
   */
  async delete(id: number): Promise<void> {
    const leave = await this.findById(id);
    if (leave.status !== 'pending') {
      throw new BusinessError('已審批的請假記錄無法刪除');
    }
    await this.leaveDAO.delete(id);
  }
}
