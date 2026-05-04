// ============================================================================
// 美業 SaaS 智慧管理系統 — 預約控制器
// ============================================================================
// 功能：預約管理、狀態流轉、統計查詢
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { AppointmentService } from '../service/AppointmentService';
import { Appointment } from '../entity/Appointment';
import { AppointmentItem } from '../entity/AppointmentItem';
import { CacheService } from '../redis/cache.service';
import { LockService } from '../redis/lock.service';
import { CacheGuardService } from '../redis/guard.service';
import {
  CacheKeyPrefix,
  AppointmentCacheKey,
} from '../redis/types';

@Controller('/api/appointments', {
  tagName: '預約',
  description: '預約管理接口',
})
export class AppointmentController {
  @Inject()
  appointmentService: AppointmentService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  lockService: LockService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢預約（含緩存）
   *
   * GET /api/appointments/:id
   */
  @Get('/:id', { summary: '查詢預約' })
  async findById(@Param('id') id: number): Promise<Appointment> {
    const cacheKey = `${CacheKeyPrefix.APPOINTMENT}${id}`;
    const result = await this.cacheGuardService.safeQuery<Appointment>(
      cacheKey,
      AppointmentCacheKey.DETAIL,
      id,
      () => this.appointmentService.findById(id),
      300
    );
    if (!result) throw new Error('預約不存在');
    return result;
  }

  /**
   * 根據訂單號查詢預約（含緩存）
   *
   * GET /api/appointments/order/:orderNo
   */
  @Get('/order/:orderNo', { summary: '根據訂單號查詢預約' })
  async findByOrderNo(
    @Param('orderNo') orderNo: string
  ): Promise<Appointment> {
    const cacheKey = `${CacheKeyPrefix.APPOINTMENT}order:${orderNo}`;
    const result = await this.cacheGuardService.safeQuery<Appointment>(
      cacheKey,
      AppointmentCacheKey.DETAIL,
      orderNo,
      () => this.appointmentService.findByOrderNo(orderNo),
      300
    );
    if (!result) throw new Error('預約不存在');
    return result;
  }

  /**
   * 查詢當前門店的預約列表（按日期範圍）
   *
   * GET /api/appointments?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('/', { summary: '查詢預約列表' })
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<Appointment[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.appointmentService.findByDateRange(shopId, startDate, endDate);
  }

  /**
   * 根據美容師和日期查詢預約
   *
   * GET /api/appointments/by-staff/:staffId?date=2024-01-15
   */
  @Get('/by-staff/:staffId', { summary: '根據美容師和日期查詢預約' })
  async findByStaffIdAndDate(
    @Param('staffId') staffId: number,
    @Query('date') date: string
  ): Promise<Appointment[]> {
    return this.appointmentService.findByStaffIdAndDate(staffId, date);
  }

  /**
   * 根據會員查詢預約（分頁）
   *
   * GET /api/appointments/by-member/:memberId?page=1&pageSize=20
   */
  @Get('/by-member/:memberId', { summary: '根據會員查詢預約' })
  async findByMemberId(
    @Param('memberId') memberId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Appointment[]; total: number }> {
    return this.appointmentService.findByMemberId(memberId, page, pageSize);
  }

  /**
   * 根據狀態查詢預約（分頁）
   *
   * GET /api/appointments/status/:status?page=1&pageSize=20
   */
  @Get('/status/:status', { summary: '根據狀態查詢預約' })
  async findByStatus(
    @Param('status')
    status:
      | 'pending'
      | 'confirmed'
      | 'in_progress'
      | 'completed'
      | 'cancelled'
      | 'no_show',
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Appointment[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.appointmentService.findByStatus(
      shopId,
      status,
      page,
      pageSize
    );
  }

  /**
   * 獲取每日統計（含緩存）
   *
   * GET /api/appointments/stats/daily?date=2024-01-15
   */
  @Get('/stats/daily', { summary: '獲取每日統計' })
  async getDailyStats(
    @Query('date') date: string
  ): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    revenue: number;
  }> {
    const shopId: number = this.ctx.state.shopId;
    const cacheKey = `${CacheKeyPrefix.APPOINTMENT}stats:daily:${shopId}:${date}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      AppointmentCacheKey.STATS,
      `stats:${shopId}:${date}`,
      () => this.appointmentService.getDailyStats(shopId, date),
      60
    );
    if (!result) {
      return { total: 0, completed: 0, cancelled: 0, noShow: 0, revenue: 0 };
    }
    return result;
  }

  /**
   * 獲取預約項目（含緩存）
   *
   * GET /api/appointments/:id/items
   */
  @Get('/:id/items', { summary: '獲取預約項目' })
  async getItems(
    @Param('id') id: number
  ): Promise<AppointmentItem[]> {
    const cacheKey = `${CacheKeyPrefix.APPOINTMENT}items:${id}`;
    const result = await this.cacheGuardService.safeQuery<AppointmentItem[]>(
      cacheKey,
      AppointmentCacheKey.DETAIL,
      `items:${id}`,
      () => this.appointmentService.getItems(id),
      300
    );
    return result || [];
  }

  /**
   * 創建預約（使用分布式鎖防止衝突）
   *
   * POST /api/appointments
   */
  @Post('/', {
    summary: '創建預約',
    middleware: ['authMiddleware'],
  })
  async create(
    @Body()
    body: {
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
    }
  ): Promise<Appointment> {
    const shopId: number = this.ctx.state.shopId;
    // 使用分布式鎖防止同一時段重複預約
    const result = await this.lockService.withLock(
      `appointment:create:${body.staffId}:${body.appointmentDate}:${body.startTime}`,
      () => this.appointmentService.create({ shopId, ...body }),
      { timeout: 5000, retryInterval: 200, maxRetries: 3 }
    );
    if (!result) throw new Error('預約創建失敗，請稍後重試');
    return result;
  }

  /**
   * 確認預約
   *
   * POST /api/appointments/:id/confirm
   */
  @Post('/:id/confirm', {
    summary: '確認預約',
    middleware: ['authMiddleware'],
  })
  async confirm(@Param('id') id: number): Promise<Appointment> {
    const result = await this.appointmentService.confirm(id);
    // 清除相關緩存
    await this.cacheService.delByPattern(`${CacheKeyPrefix.APPOINTMENT}*`);
    return result;
  }

  /**
   * 開始服務
   *
   * POST /api/appointments/:id/start
   */
  @Post('/:id/start', {
    summary: '開始服務',
    middleware: ['authMiddleware'],
  })
  async startService(@Param('id') id: number): Promise<Appointment> {
    const result = await this.appointmentService.startService(id);
    await this.cacheService.delByPattern(`${CacheKeyPrefix.APPOINTMENT}*`);
    return result;
  }

  /**
   * 完成預約
   *
   * POST /api/appointments/:id/complete
   */
  @Post('/:id/complete', {
    summary: '完成預約',
    middleware: ['authMiddleware'],
  })
  async complete(@Param('id') id: number): Promise<Appointment> {
    const result = await this.appointmentService.complete(id);
    await this.cacheService.delByPattern(`${CacheKeyPrefix.APPOINTMENT}*`);
    return result;
  }

  /**
   * 取消預約（使用分布式鎖）
   *
   * POST /api/appointments/:id/cancel
   */
  @Post('/:id/cancel', {
    summary: '取消預約',
    middleware: ['authMiddleware'],
  })
  async cancel(
    @Param('id') id: number,
    @Body() body?: { reason?: string }
  ): Promise<Appointment> {
    const result = await this.lockService.withLock(
      `appointment:cancel:${id}`,
      async () => {
        const r = await this.appointmentService.cancel(id, body?.reason);
        await this.cacheService.delByPattern(`${CacheKeyPrefix.APPOINTMENT}*`);
        return r;
      },
      { timeout: 5000 }
    );
    if (!result) throw new Error('取消失敗，請稍後重試');
    return result;
  }

  /**
   * 標記為未到
   *
   * POST /api/appointments/:id/no-show
   */
  @Post('/:id/no-show', {
    summary: '標記為未到',
    middleware: ['authMiddleware'],
  })
  async markNoShow(@Param('id') id: number): Promise<Appointment> {
    const result = await this.appointmentService.markNoShow(id);
    await this.cacheService.delByPattern(`${CacheKeyPrefix.APPOINTMENT}*`);
    return result;
  }
}
