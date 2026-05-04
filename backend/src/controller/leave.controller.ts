// ============================================================================
// 美業 SaaS 智慧管理系統 — 請假控制器
// ============================================================================
// 功能：請假申請、審批、查詢
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
import { LeaveService } from '../service/LeaveService';
import { Leave } from '../entity/Leave';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';

const LEAVE_CACHE_PREFIX = 'leave:';

@Controller('/api/leaves', {
  tagName: '請假',
  description: '請假申請與審批接口',
})
export class LeaveController {
  @Inject()
  leaveService: LeaveService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢請假記錄（含緩存）
   *
   * GET /api/leaves/:id
   */
  @Get('/:id', { summary: '查詢請假記錄' })
  async findById(@Param('id') id: number): Promise<Leave> {
    const cacheKey = `${LEAVE_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<Leave>(
      cacheKey,
      LEAVE_CACHE_PREFIX,
      id,
      () => this.leaveService.findById(id),
      300
    );
    if (!result) throw new Error('請假記錄不存在');
    return result;
  }

  /**
   * 查詢當前門店的請假記錄（分頁）
   *
   * GET /api/leaves?page=1&pageSize=20
   */
  @Get('/', { summary: '查詢請假記錄列表' })
  async findByShopId(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Leave[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.leaveService.findByShopId(shopId, page, pageSize);
  }

  /**
   * 查詢美容師的請假記錄（分頁）
   *
   * GET /api/leaves/by-staff/:staffId?page=1&pageSize=20
   */
  @Get('/by-staff/:staffId', { summary: '查詢美容師的請假記錄' })
  async findByStaffId(
    @Param('staffId') staffId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Leave[]; total: number }> {
    return this.leaveService.findByStaffId(staffId, page, pageSize);
  }

  /**
   * 查詢待審批的請假記錄
   *
   * GET /api/leaves/pending
   */
  @Get('/pending', { summary: '查詢待審批的請假記錄' })
  async findPending(): Promise<Leave[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.leaveService.findPending(shopId);
  }

  /**
   * 創建請假申請
   *
   * POST /api/leaves
   */
  @Post('/', { summary: '創建請假申請', middleware: ['authMiddleware'] })
  async create(
    @Body()
    body: {
      type: 'annual' | 'sick' | 'personal' | 'other';
      startDate: string;
      endDate: string;
      reason?: string;
    }
  ): Promise<Leave> {
    const staffId: number = this.ctx.state.staffId;
    const result = await this.leaveService.create({ staffId, ...body });
    await this.cacheService.delByPattern(`${LEAVE_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 審批請假
   *
   * POST /api/leaves/:id/approve
   */
  @Post('/:id/approve', {
    summary: '審批請假',
    middleware: ['authMiddleware'],
  })
  async approve(
    @Param('id') id: number,
    @Body() body: { status: 'approved' | 'rejected'; remark?: string }
  ): Promise<Leave> {
    const approvedBy: number = this.ctx.state.staffId;
    const result = await this.leaveService.approve(id, approvedBy, body.status, body.remark);
    await this.cacheService.delByPattern(`${LEAVE_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 更新請假記錄
   *
   * PUT /api/leaves/:id
   */
  @Put('/:id', { summary: '更新請假記錄', middleware: ['authMiddleware'] })
  async update(
    @Param('id') id: number,
    @Body() body: Partial<Leave>
  ): Promise<Leave> {
    const result = await this.leaveService.update(id, body);
    await this.cacheService.delByPattern(`${LEAVE_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 刪除請假記錄
   *
   * DELETE /api/leaves/:id
   */
  @Del('/:id', { summary: '刪除請假記錄', middleware: ['authMiddleware'] })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.leaveService.delete(id);
    await this.cacheService.delByPattern(`${LEAVE_CACHE_PREFIX}*`);
    return { message: '刪除成功' };
  }
}
