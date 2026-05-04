// ============================================================================
// 美業 SaaS 智慧管理系統 — 排班 DAO
// ============================================================================
// 功能：排班表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, Between } from 'typeorm';
import { Schedule } from '../entity/Schedule';

@Provide()
export class ScheduleDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢排班
   *
   * @param id - 排班 ID
   * @returns 排班實體或 null
   */
  async findById(id: number): Promise<Schedule | null> {
    return this.entityManager.findOne(Schedule, {
      where: { id },
    });
  }

  /**
   * 根據美容師 ID 查詢排班
   *
   * @param staffId - 美容師 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 排班列表
   */
  async findByStaffId(
    staffId: number,
    startDate?: string,
    endDate?: string
  ): Promise<Schedule[]> {
    const where: any = { staffId };

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    return this.entityManager.find(Schedule, {
      where,
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  /**
   * 根據門店 ID 查詢排班
   *
   * @param shopId - 門店 ID
   * @param date - 日期
   * @returns 排班列表
   */
  async findByShopIdAndDate(shopId: number, date: string): Promise<Schedule[]> {
    return this.entityManager
      .createQueryBuilder(Schedule, 'schedule')
      .innerJoinAndSelect('schedule.staff', 'staff')
      .where('staff.shopId = :shopId', { shopId })
      .andWhere('schedule.date = :date', { date })
      .orderBy('schedule.startTime', 'ASC')
      .getMany();
  }

  /**
   * 根據日期範圍查詢排班
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 排班列表
   */
  async findByDateRange(
    shopId: number,
    startDate: string,
    endDate: string
  ): Promise<Schedule[]> {
    return this.entityManager
      .createQueryBuilder(Schedule, 'schedule')
      .innerJoinAndSelect('schedule.staff', 'staff')
      .where('staff.shopId = :shopId', { shopId })
      .andWhere('schedule.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('schedule.date', 'ASC')
      .addOrderBy('schedule.startTime', 'ASC')
      .getMany();
  }

  /**
   * 查詢指定時間段內可用的美容師排班
   *
   * @param shopId - 門店 ID
   * @param date - 日期
   * @param startTime - 開始時間
   * @param endTime - 結束時間
   * @returns 排班列表
   */
  async findAvailable(
    shopId: number,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<Schedule[]> {
    return this.entityManager
      .createQueryBuilder(Schedule, 'schedule')
      .innerJoinAndSelect('schedule.staff', 'staff')
      .where('staff.shopId = :shopId', { shopId })
      .andWhere('schedule.date = :date', { date })
      .andWhere('schedule.status = :status', { status: 'available' })
      .andWhere('schedule.isOff = :isOff', { isOff: false })
      .andWhere('schedule.startTime <= :startTime', { startTime })
      .andWhere('schedule.endTime >= :endTime', { endTime })
      .orderBy('schedule.startTime', 'ASC')
      .getMany();
  }

  /**
   * 檢查排班時間衝突
   *
   * @param staffId - 美容師 ID
   * @param date - 日期
   * @param startTime - 開始時間
   * @param endTime - 結束時間
   * @param excludeId - 排除的排班 ID
   * @returns 是否存在衝突
   */
  async checkConflict(
    staffId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: number
  ): Promise<boolean> {
    const queryBuilder = this.entityManager
      .createQueryBuilder(Schedule, 'schedule')
      .where('schedule.staffId = :staffId', { staffId })
      .andWhere('schedule.date = :date', { date })
      .andWhere('schedule.isOff = :isOff', { isOff: false })
      .andWhere(
        '(schedule.startTime < :endTime AND schedule.endTime > :startTime)',
        { startTime, endTime }
      );

    if (excludeId) {
      queryBuilder.andWhere('schedule.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * 創建排班
   *
   * @param schedule - 排班實體
   * @returns 創建後的排班
   */
  async create(schedule: Partial<Schedule>): Promise<Schedule> {
    const entity = this.entityManager.create(Schedule, schedule);
    return this.entityManager.save(entity);
  }

  /**
   * 批量創建排班
   *
   * @param schedules - 排班實體列表
   * @returns 創建後的排班列表
   */
  async createBatch(schedules: Partial<Schedule>[]): Promise<Schedule[]> {
    const entities = this.entityManager.create(Schedule, schedules);
    return this.entityManager.save(entities);
  }

  /**
   * 更新排班
   *
   * @param id - 排班 ID
   * @param data - 更新數據
   * @returns 更新後的排班
   */
  async update(id: number, data: Partial<Schedule>): Promise<Schedule | null> {
    await this.entityManager.update(Schedule, id, data as any);
    return this.findById(id);
  }

  /**
   * 刪除排班
   *
   * @param id - 排班 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(Schedule, id);
  }

  /**
   * 批量刪除排班
   *
   * @param ids - 排班 ID 列表
   */
  async deleteBatch(ids: number[]): Promise<void> {
    await this.entityManager.delete(Schedule, ids);
  }
}
