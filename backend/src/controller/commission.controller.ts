// ============================================================================
// 美業 SaaS 智慧管理系統 — 佣金控制器
// ============================================================================
// 功能：佣金記錄查詢、統計
// ============================================================================

import {
  Controller,
  Get,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { CommissionService } from '../service/CommissionService';
import { Commission } from '../entity/Commission';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';
import { CacheKeyPrefix, PerformanceCacheKey } from '../redis/types';

const COMMISSION_CACHE_PREFIX = 'comm:';

@Controller('/commissions', {
  tagName: '佣金',
  description: '佣金記錄查詢與統計接口',
})
export class CommissionController {
  @Inject()
  commissionService: CommissionService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢佣金記錄（含緩存）
   *
   * GET /api/commissions/:id
   */
  @Get('/:id', { summary: '查詢佣金記錄' })
  async findById(@Param('id') id: number): Promise<Commission> {
    const cacheKey = `${COMMISSION_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<Commission>(
      cacheKey,
      COMMISSION_CACHE_PREFIX,
      id,
      () => this.commissionService.findById(id),
      300
    );
    if (!result) throw new Error('佣金記錄不存在');
    return result;
  }

  /**
   * 查詢當前門店的佣金列表（分頁）
   *
   * GET /api/commissions?page=1&pageSize=20
   */
  @Get('/', { summary: '查詢佣金列表' })
  async findByShopId(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Commission[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.commissionService.findByShopId(shopId, page, pageSize);
  }

  /**
   * 查詢美容師的佣金（分頁）
   *
   * GET /api/commissions/by-staff/:staffId?page=1&pageSize=20
   */
  @Get('/by-staff/:staffId', { summary: '查詢美容師的佣金' })
  async findByStaffId(
    @Param('staffId') staffId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Commission[]; total: number }> {
    return this.commissionService.findByStaffId(staffId, page, pageSize);
  }

  /**
   * 查詢未結算佣金
   *
   * GET /api/commissions/unsettled/:staffId
   */
  @Get('/unsettled/:staffId', { summary: '查詢未結算佣金' })
  async findUnsettledByStaffId(
    @Param('staffId') staffId: number
  ): Promise<Commission[]> {
    return this.commissionService.findUnsettledByStaffId(staffId);
  }

  /**
   * 獲取美容師佣金統計（含緩存）
   *
   * GET /api/commissions/stats/:staffId?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('/stats/:staffId', { summary: '獲取美容師佣金統計' })
  async getStaffCommissionStats(
    @Param('staffId') staffId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<{
    totalCommission: number;
    totalBonus: number;
    totalDeduction: number;
  }> {
    const cacheKey = `${COMMISSION_CACHE_PREFIX}stats:${staffId}:${startDate}:${endDate}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      PerformanceCacheKey.COMMISSION,
      `${staffId}:${startDate}:${endDate}`,
      () => this.commissionService.getStaffCommissionStats(
        staffId,
        new Date(startDate),
        new Date(endDate)
      ),
      120
    );
    if (!result) {
      return { totalCommission: 0, totalBonus: 0, totalDeduction: 0 };
    }
    return result;
  }
}
