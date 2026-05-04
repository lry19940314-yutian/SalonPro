// ============================================================================
// 美業 SaaS 智慧管理系統 — 通知控制器
// ============================================================================
// 功能：通知管理接口（集成 Redis 緩存）
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
import { NotificationService } from '../service/NotificationService';
import { Notification } from '../entity/Notification';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';

const NOTIFICATION_CACHE_PREFIX = 'notif:';

@Controller('/api/notifications', {
  tagName: '通知',
  description: '通知管理接口',
})
export class NotificationController {
  @Inject()
  notificationService: NotificationService;

  @Inject()
  ctx: Context;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  /**
   * 根據 ID 查詢通知
   *
   * GET /api/notifications/:id
   */
  @Get('/:id', { summary: '查詢通知' })
  async findById(@Param('id') id: number): Promise<Notification> {
    const cacheKey = `${NOTIFICATION_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<Notification>(
      cacheKey, NOTIFICATION_CACHE_PREFIX, id,
      () => this.notificationService.findById(id), 600
    );
    if (!result) throw new Error('通知不存在');
    return result;
  }

  /**
   * 查詢當前門店的通知（分頁）
   *
   * GET /api/notifications?page=1&pageSize=20
   */
  @Get('/', { summary: '查詢通知列表' })
  async findByShopId(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Notification[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.notificationService.findByShopId(shopId, page, pageSize);
  }

  /**
   * 根據接收類型查詢（分頁）
   *
   * GET /api/notifications/receiver-type/:receiverType?page=1&pageSize=20
   */
  @Get('/receiver-type/:receiverType', { summary: '根據接收類型查詢' })
  async findByReceiverType(
    @Param('receiverType') receiverType: 'staff' | 'member' | 'all',
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Notification[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.notificationService.findByReceiverType(
      shopId,
      receiverType,
      page,
      pageSize
    );
  }

  /**
   * 根據發送狀態查詢
   *
   * GET /api/notifications/status/:status
   */
  @Get('/status/:status', { summary: '根據發送狀態查詢' })
  async findByStatus(
    @Param('status') status: 'pending' | 'sent' | 'failed'
  ): Promise<Notification[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.notificationService.findByStatus(shopId, status);
  }

  /**
   * 創建通知
   *
   * POST /api/notifications
   */
  @Post('/', { summary: '創建通知', middleware: ['authMiddleware'] })
  async create(
    @Body()
    body: {
      type:
        | 'appointment_reminder'
        | 'appointment_completed'
        | 'system_alert'
        | 'marketing'
        | 'leave_approval'
        | 'pick_approval';
      title: string;
      content: string;
      receiverType: 'staff' | 'member' | 'all';
      channel: 'in_app' | 'sms' | 'push';
    }
  ): Promise<Notification> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.notificationService.create({ shopId, ...body });
    await this.cacheService.delByPattern(`${NOTIFICATION_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 批量創建通知
   *
   * POST /api/notifications/batch
   */
  @Post('/batch', {
    summary: '批量創建通知',
    middleware: ['authMiddleware'],
  })
  async createBatch(
    @Body()
    body: {
      notifications: Array<{
        type:
          | 'appointment_reminder'
          | 'appointment_completed'
          | 'system_alert'
          | 'marketing'
          | 'leave_approval'
          | 'pick_approval';
        title: string;
        content: string;
        receiverType: 'staff' | 'member' | 'all';
        channel: 'in_app' | 'sms' | 'push';
      }>;
    }
  ): Promise<Notification[]> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.notificationService.createBatch(
      body.notifications.map((n) => ({ shopId, ...n }))
    );
    await this.cacheService.delByPattern(`${NOTIFICATION_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 更新通知狀態
   *
   * POST /api/notifications/:id/status
   */
  @Post('/:id/status', {
    summary: '更新通知狀態',
    middleware: ['authMiddleware'],
  })
  async updateStatus(
    @Param('id') id: number,
    @Body() body: { status: 'pending' | 'sent' | 'failed' }
  ): Promise<Notification> {
    const result = await this.notificationService.updateStatus(id, body.status);
    await this.cacheService.delByPattern(`${NOTIFICATION_CACHE_PREFIX}*`);
    return result;
  }
}
