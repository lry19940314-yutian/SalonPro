// ============================================================================
// 美業 SaaS 智慧管理系統 — 排班/場務服務
// ============================================================================
// 功能：排班管理、衝突檢測、班次查詢
// ============================================================================

import { Provide } from '@midwayjs/core';
import { ScheduleDAO } from '../dao/ScheduleDAO';
import { StaffDAO } from '../dao/StaffDAO';
import { Schedule } from '../entity/Schedule';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class ScheduleService {
  constructor(
    private readonly scheduleDAO: ScheduleDAO,
    private readonly staffDAO: StaffDAO
  ) {}

  /**
   * 根據 ID 查詢排班
   */
  async findById(id: number): Promise<Schedule> {
    const schedule = await this.scheduleDAO.findById(id);
    if (!schedule) {
      throw new NotFoundError('排班記錄不存在');
    }
    return schedule;
  }

  /**
   * 根據美容師 ID 查詢排班
   */
  async findByStaffId(staffId: number, startDate?: string, endDate?: string): Promise<Schedule[]> {
    if (startDate && endDate) {
      return this.scheduleDAO.findByDateRange(staffId, startDate, endDate);
    }
    return this.scheduleDAO.findByStaffId(staffId);
  }

  /**
   * 根據門店和日期查詢排班
   */
  async findByShopIdAndDate(shopId: number, date: string): Promise<Schedule[]> {
    return this.scheduleDAO.findByShopIdAndDate(shopId, date);
  }

  /**
   * 查詢可用排班
   */
  async findAvailable(shopId: number, date: string, startTime: string, endTime: string): Promise<Schedule[]> {
    return this.scheduleDAO.findAvailable(shopId, date, startTime, endTime);
  }

  /**
   * 創建排班
   */
  async create(data: {
    staffId: number;
    date: string;
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
  }): Promise<Schedule> {
    // 驗證美容師存在
    const staff = await this.staffDAO.findById(data.staffId);
    if (!staff) {
      throw new NotFoundError('美容師不存在');
    }

    // 檢查時間衝突
    const hasConflict = await this.scheduleDAO.checkConflict(
      data.staffId, data.date, data.startTime, data.endTime
    );
    if (hasConflict) {
      throw new BusinessError('該時段已有排班，存在時間衝突');
    }

    return this.scheduleDAO.create({
      staffId: data.staffId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      breakStart: data.breakStart,
      breakEnd: data.breakEnd,
      status: 'available',
    });
  }

  /**
   * 批量創建排班
   */
  async createBatch(schedules: Array<{
    staffId: number;
    date: string;
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
  }>): Promise<Schedule[]> {
    const records: Partial<Schedule>[] = [];

    for (const s of schedules) {
      const hasConflict = await this.scheduleDAO.checkConflict(
        s.staffId, s.date, s.startTime, s.endTime
      );
      if (hasConflict) {
        const staff = await this.staffDAO.findById(s.staffId);
        throw new BusinessError(
          `美容師 ${staff?.name || s.staffId} 在 ${s.date} ${s.startTime}-${s.endTime} 時段已有排班`
        );
      }
      records.push({
        staffId: s.staffId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        breakStart: s.breakStart,
        breakEnd: s.breakEnd,
        status: 'available',
      });
    }

    return this.scheduleDAO.createBatch(records);
  }

  /**
   * 更新排班
   */
  async update(id: number, data: Partial<Schedule>): Promise<Schedule> {
    const schedule = await this.findById(id);

    // 如果更新時間，檢查衝突
    if (data.startTime || data.endTime) {
      const startTime = data.startTime || schedule.startTime;
      const endTime = data.endTime || schedule.endTime;
      const hasConflict = await this.scheduleDAO.checkConflict(
        schedule.staffId, schedule.date, startTime, endTime, id
      );
      if (hasConflict) {
        throw new BusinessError('更新後的時段與其他排班衝突');
      }
    }

    const updated = await this.scheduleDAO.update(id, data);
    if (!updated) {
      throw new BusinessError('更新排班失敗');
    }
    return updated;
  }

  /**
   * 刪除排班
   */
  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.scheduleDAO.delete(id);
  }

  /**
   * 批量刪除排班
   */
  async deleteBatch(ids: number[]): Promise<void> {
    await this.scheduleDAO.deleteBatch(ids);
  }

  /**
   * 將排班標記為忙碌（已被預約）
   */
  async markAsBusy(id: number): Promise<void> {
    await this.findById(id);
    await this.scheduleDAO.update(id, { status: 'busy' });
  }

  /**
   * 將排班標記為可用
   */
  async markAsAvailable(id: number): Promise<void> {
    await this.findById(id);
    await this.scheduleDAO.update(id, { status: 'available' });
  }

  /**
   * 將排班標記為休息
   */
  async markAsOff(id: number): Promise<void> {
    await this.findById(id);
    await this.scheduleDAO.update(id, { status: 'off' });
  }
}
