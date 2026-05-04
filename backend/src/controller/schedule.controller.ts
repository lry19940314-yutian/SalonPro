// ============================================================================
// 美業 SaaS 智慧管理系統 — 排班/場務控制器
// ============================================================================
// 功能：排班管理、衝突檢測、班次查詢
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Del,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ScheduleService } from '../service/ScheduleService';
import { Schedule } from '../entity/Schedule';
import { CacheService } from '../redis/cache.service';
import { LockService } from '../redis/lock.service';
import { CacheGuardService } from '../redis/guard.service';
import { managerOnly } from '../middleware/role.middleware';

const SCHEDULE_CACHE_PREFIX = 'sched:';

@Controller('/api/schedules', {
  tagName: '排班/場務',
  description: '排班管理接口',
})
export class ScheduleController {
  @Inject()
  scheduleService: ScheduleService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  lockService: LockService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢排班（含緩存）
   *
   * GET /api/schedules/:id
   */
  @Get('/:id', { summary: '查詢排班' })
  async findById(@Param('id') id: number): Promise<Schedule> {
    const cacheKey = `${SCHEDULE_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<Schedule>(
      cacheKey,
      SCHEDULE_CACHE_PREFIX,
      id,
      () => this.scheduleService.findById(id),
      300
    );
    if (!result) throw new Error('排班不存在');
    return result;
  }

  /**
   * 查詢當前門店指定日期的排班（含緩存）
   *
   * GET /api/schedules?date=2024-01-15
   */
  @Get('/', { summary: '查詢排班列表' })
  async findByShopIdAndDate(
    @Query('date') date: string
  ): Promise<Schedule[]> {
    const shopId: number = this.ctx.state.shopId;
    const cacheKey = `${SCHEDULE_CACHE_PREFIX}shop:${shopId}:${date}`;
    const result = await this.cacheGuardService.safeQuery<Schedule[]>(
      cacheKey,
      SCHEDULE_CACHE_PREFIX,
      `shop:${shopId}:${date}`,
      () => this.scheduleService.findByShopIdAndDate(shopId, date),
      120
    );
    return result || [];
  }

  /**
   * 查詢美容師的排班
   *
   * GET /api/schedules/by-staff/:staffId?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('/by-staff/:staffId', { summary: '查詢美容師的排班' })
  async findByStaffId(
    @Param('staffId') staffId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<Schedule[]> {
    return this.scheduleService.findByStaffId(staffId, startDate, endDate);
  }

  /**
   * 查詢可用排班
   *
   * GET /api/schedules/available?date=2024-01-15&startTime=09:00&endTime=18:00
   */
  @Get('/available', { summary: '查詢可用排班' })
  async findAvailable(
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string
  ): Promise<Schedule[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.scheduleService.findAvailable(shopId, date, startTime, endTime);
  }

  /**
   * 創建排班
   *
   * POST /api/schedules
   */
  @Post('/', { summary: '創建排班', middleware: ['authMiddleware'] })
  async create(
    @Body()
    body: {
      staffId: number;
      date: string;
      startTime: string;
      endTime: string;
      breakStart?: string;
      breakEnd?: string;
    }
  ): Promise<Schedule> {
    const result = await this.scheduleService.create(body);
    await this.cacheService.delByPattern(`${SCHEDULE_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 批量創建排班
   *
   * POST /api/schedules/batch
   */
  @Post('/batch', {
    summary: '批量創建排班',
    middleware: ['authMiddleware'],
  })
  async createBatch(
    @Body()
    body: {
      schedules: Array<{
        staffId: number;
        date: string;
        startTime: string;
        endTime: string;
        breakStart?: string;
        breakEnd?: string;
      }>;
    }
  ): Promise<Schedule[]> {
    const result = await this.scheduleService.createBatch(body.schedules);
    await this.cacheService.delByPattern(`${SCHEDULE_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 更新排班
   *
   * PUT /api/schedules/:id
   */
  @Put('/:id', { summary: '更新排班', middleware: ['authMiddleware'] })
  async update(
    @Param('id') id: number,
    @Body() body: Partial<Schedule>
  ): Promise<Schedule> {
    const result = await this.scheduleService.update(id, body);
    await this.cacheService.delByPattern(`${SCHEDULE_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 刪除排班
   *
   * DELETE /api/schedules/:id
   */
  @Del('/:id', { summary: '刪除排班', middleware: ['authMiddleware'] })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.scheduleService.delete(id);
    await this.cacheService.delByPattern(`${SCHEDULE_CACHE_PREFIX}*`);
    return { message: '刪除成功' };
  }

  /**
   * 批量刪除排班
   *
   * POST /api/schedules/batch-delete
   */
  @Post('/batch-delete', {
    summary: '批量刪除排班',
    middleware: ['authMiddleware'],
  })
  async deleteBatch(
    @Body() body: { ids: number[] }
  ): Promise<{ message: string }> {
    await this.scheduleService.deleteBatch(body.ids);
    await this.cacheService.delByPattern(`${SCHEDULE_CACHE_PREFIX}*`);
    return { message: '刪除成功' };
  }

  /**
   * 標記排班為忙碌
   *
   * POST /api/schedules/:id/mark-busy
   */
  @Post('/:id/mark-busy', {
    summary: '標記排班為忙碌',
    middleware: ['authMiddleware'],
  })
  async markAsBusy(@Param('id') id: number): Promise<{ message: string }> {
    await this.scheduleService.markAsBusy(id);
    await this.cacheService.delByPattern(`${SCHEDULE_CACHE_PREFIX}*`);
    return { message: '更新成功' };
  }

  /**
   * 標記排班為可用
   *
   * POST /api/schedules/:id/mark-available
   */
  @Post('/:id/mark-available', {
    summary: '標記排班為可用',
    middleware: ['authMiddleware'],
  })
  async markAsAvailable(
    @Param('id') id: number
  ): Promise<{ message: string }> {
    await this.scheduleService.markAsAvailable(id);
    await this.cacheService.delByPattern(`${SCHEDULE_CACHE_PREFIX}*`);
    return { message: '更新成功' };
  }

  /**
   * 標記排班為休息
   *
   * POST /api/schedules/:id/mark-off
   */
  @Post('/:id/mark-off', {
    summary: '標記排班為休息',
    middleware: ['authMiddleware'],
  })
  async markAsOff(@Param('id') id: number): Promise<{ message: string }> {
    await this.scheduleService.markAsOff(id);
    await this.cacheService.delByPattern(`${SCHEDULE_CACHE_PREFIX}*`);
    return { message: '更新成功' };
  }
}
