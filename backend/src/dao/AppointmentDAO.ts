// ============================================================================
// 美業 SaaS 智慧管理系統 — 預約 DAO
// ============================================================================
// 功能：預約表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, Between } from 'typeorm';
import { Appointment } from '../entity/Appointment';

@Provide()
export class AppointmentDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢預約
   *
   * @param id - 預約 ID
   * @returns 預約實體或 null
   */
  async findById(id: number): Promise<Appointment | null> {
    return this.entityManager.findOne(Appointment, {
      where: { id },
    });
  }

  /**
   * 根據預約單號查詢
   *
   * @param orderNo - 預約單號
   * @returns 預約實體或 null
   */
  async findByOrderNo(orderNo: string): Promise<Appointment | null> {
    return this.entityManager.findOne(Appointment, {
      where: { orderNo },
    });
  }

  /**
   * 根據門店 ID 查詢預約列表
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 預約列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Appointment[], number]> {
    return this.entityManager.findAndCount(Appointment, {
      where: { shopId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據美容師 ID 查詢預約
   *
   * @param staffId - 美容師 ID
   * @param date - 日期
   * @returns 預約列表
   */
  async findByStaffIdAndDate(staffId: number, date: string): Promise<Appointment[]> {
    return this.entityManager.find(Appointment, {
      where: {
        staffId,
        appointmentDate: date,
      },
      order: { startTime: 'ASC' },
    });
  }

  /**
   * 根據會員 ID 查詢預約
   *
   * @param memberId - 會員 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 預約列表及總數
   */
  async findByMemberId(
    memberId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Appointment[], number]> {
    return this.entityManager.findAndCount(Appointment, {
      where: { memberId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 查詢指定日期範圍的預約
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 預約列表
   */
  async findByDateRange(
    shopId: number,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    return this.entityManager.find(Appointment, {
      where: {
        shopId,
        appointmentDate: Between(startDate, endDate),
      },
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });
  }

  /**
   * 查詢指定狀態的預約
   *
   * @param shopId - 門店 ID
   * @param status - 預約狀態
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 預約列表及總數
   */
  async findByStatus(
    shopId: number,
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show',
    page = 1,
    pageSize = 20
  ): Promise<[Appointment[], number]> {
    return this.entityManager.findAndCount(Appointment, {
      where: { shopId, status },
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 檢查時間段是否可預約
   *
   * @param staffId - 美容師 ID
   * @param date - 日期
   * @param startTime - 開始時間
   * @param endTime - 結束時間
   * @param excludeId - 排除的預約 ID
   * @returns 是否存在衝突
   */
  async checkTimeConflict(
    staffId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: number
  ): Promise<boolean> {
    const queryBuilder = this.entityManager
      .createQueryBuilder(Appointment, 'appointment')
      .where('appointment.staffId = :staffId', { staffId })
      .andWhere('appointment.appointmentDate = :date', { date })
      .andWhere('appointment.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled', 'no_show'],
      })
      .andWhere(
        '(appointment.startTime < :endTime AND appointment.endTime > :startTime)',
        { startTime, endTime }
      );

    if (excludeId) {
      queryBuilder.andWhere('appointment.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * 創建預約
   *
   * @param appointment - 預約實體
   * @returns 創建後的預約
   */
  async create(appointment: Partial<Appointment>): Promise<Appointment> {
    const entity = this.entityManager.create(Appointment, appointment);
    return this.entityManager.save(entity);
  }

  /**
   * 更新預約
   *
   * @param id - 預約 ID
   * @param data - 更新數據
   * @returns 更新後的預約
   */
  async update(id: number, data: Partial<Appointment>): Promise<Appointment | null> {
    await this.entityManager.update(Appointment, id, data as any);
    return this.findById(id);
  }

  /**
   * 取消預約
   *
   * @param id - 預約 ID
   * @param cancelReason - 取消原因
   */
  async cancel(id: number, cancelReason?: string): Promise<void> {
    await this.entityManager.update(Appointment, id, {
      status: 'cancelled',
      cancelReason: cancelReason || null,
    } as any);
  }

  /**
   * 完成預約
   *
   * @param id - 預約 ID
   */
  async complete(id: number): Promise<void> {
    await this.entityManager.update(Appointment, id, {
      status: 'completed',
    } as any);
  }

  /**
   * 獲取指定門店指定日期的預約統計
   *
   * @param shopId - 門店 ID
   * @param date - 日期
   * @returns 統計信息
   */
  async getDailyStats(shopId: number, date: string): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    revenue: number;
  }> {
    const appointments = await this.entityManager.find(Appointment, {
      where: {
        shopId,
        appointmentDate: date,
      },
    });

    const stats = {
      total: appointments.length,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      revenue: 0,
    };

    for (const apt of appointments) {
      switch (apt.status) {
        case 'completed':
          stats.completed++;
          stats.revenue += Number(apt.finalAmount || 0);
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
        case 'no_show':
          stats.noShow++;
          break;
      }
    }

    return stats;
  }
}
