// ============================================================================
// 美業 SaaS 智慧管理系統 — 業績控制器
// ============================================================================
// 功能：業績記錄查詢、統計
// ============================================================================

import {
  Controller,
  Get,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { PerformanceService } from '../service/PerformanceService';
import { Performance } from '../entity/Performance';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';
import { CacheKeyPrefix, PerformanceCacheKey } from '../redis/types';

@Controller('/performances', {
  tagName: '業績',
  description: '業績記錄查詢與統計接口',
})
export class PerformanceController {
  @Inject()
  performanceService: PerformanceService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢業績記錄（含緩存）
   *
   * GET /api/performances/:id
   */
  @Get('/:id', { summary: '查詢業績記錄' })
  async findById(@Param('id') id: number): Promise<Performance> {
    const cacheKey = `${CacheKeyPrefix.PERFORMANCE}${id}`;
    const result = await this.cacheGuardService.safeQuery<Performance>(
      cacheKey,
      PerformanceCacheKey.DAILY,
      id,
      () => this.performanceService.findById(id),
      300
    );
    if (!result) throw new Error('業績記錄不存在');
    return result;
  }

  /**
   * 查詢當前門店的業績列表（分頁）
   *
   * GET /api/performances?page=1&pageSize=20
   */
  @Get('/', { summary: '查詢業績列表' })
  async findByShopId(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Performance[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.performanceService.findByShopId(shopId, page, pageSize);
  }

  /**
   * 查詢美容師的業績（分頁）
   *
   * GET /api/performances/by-staff/:staffId?page=1&pageSize=20
   */
  @Get('/by-staff/:staffId', { summary: '查詢美容師的業績' })
  async findByStaffId(
    @Param('staffId') staffId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Performance[]; total: number }> {
    return this.performanceService.findByStaffId(staffId, page, pageSize);
  }

  /**
   * 查詢指定日期範圍的業績
   *
   * GET /api/performances/by-date?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('/by-date', { summary: '查詢指定日期範圍的業績' })
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<Performance[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.performanceService.findByDateRange(shopId, startDate, endDate);
  }

  /**
   * 查詢美容師指定日期範圍的業績
   *
   * GET /api/performances/staff-date/:staffId?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('/staff-date/:staffId', { summary: '查詢美容師指定日期範圍的業績' })
  async findByStaffIdAndDateRange(
    @Param('staffId') staffId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<Performance[]> {
    return this.performanceService.findByStaffIdAndDateRange(
      staffId,
      startDate,
      endDate
    );
  }

  /**
   * 查詢未結算的業績
   *
   * GET /api/performances/unsettled/:staffId
   */
  @Get('/unsettled/:staffId', { summary: '查詢未結算的業績' })
  async findUnsettled(
    @Param('staffId') staffId: number
  ): Promise<Performance[]> {
    return this.performanceService.findUnsettled(staffId);
  }

  /**
   * 獲取美容師業績統計（含緩存）
   *
   * GET /api/performances/stats/staff/:staffId?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('/stats/staff/:staffId', { summary: '獲取美容師業績統計' })
  async getStaffPerformanceStats(
    @Param('staffId') staffId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<{
    totalAmount: number;
    totalCommission: number;
    serviceCount: number;
    productCount: number;
  }> {
    const cacheKey = `${PerformanceCacheKey.DAILY}${staffId}:${startDate}:${endDate}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      PerformanceCacheKey.DAILY,
      `${staffId}:${startDate}:${endDate}`,
      () => this.performanceService.getStaffPerformanceStats(staffId, startDate, endDate),
      120
    );
    if (!result) {
      return { totalAmount: 0, totalCommission: 0, serviceCount: 0, productCount: 0 };
    }
    return result;
  }

  /**
   * 獲取門店業績統計（含緩存）
   *
   * GET /api/performances/stats/shop?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('/stats/shop', { summary: '獲取門店業績統計' })
  async getShopPerformanceStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<{
    totalAmount: number;
    totalCommission: number;
    totalCount: number;
  }> {
    const shopId: number = this.ctx.state.shopId;
    const cacheKey = `${PerformanceCacheKey.DAILY}shop:${shopId}:${startDate}:${endDate}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      PerformanceCacheKey.DAILY,
      `shop:${shopId}:${startDate}:${endDate}`,
      () => this.performanceService.getShopPerformanceStats(shopId, startDate, endDate),
      120
    );
    if (!result) {
      return { totalAmount: 0, totalCommission: 0, totalCount: 0 };
    }
    return result;
  }

  /**
   * 獲取工作人員業績排行（含緩存）
   *
   * GET /api/performances/staff-ranking?startDate=2026-05-01&endDate=2026-05-31&limit=10
   */
  @Get('/staff-ranking', { summary: '獲取工作人員業績排行' })
  async getStaffRanking(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: number
  ): Promise<Array<{
    staffId: number;
    name: string;
    amount: number;
    percentage: number;
  }>> {
    const shopId: number = this.ctx.state.shopId;
    const rankingLimit = limit || 10;
    const cacheKey = `${PerformanceCacheKey.DAILY}staffRanking:${shopId}:${startDate}:${endDate}:${rankingLimit}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      PerformanceCacheKey.DAILY,
      `staffRanking:${shopId}:${startDate}:${endDate}:${rankingLimit}`,
      () => this.performanceService.getStaffRanking(shopId, startDate, endDate, rankingLimit),
      120
    );
    return result || [];
  }

  /**
   * 獲取門店分類營業額統計（含緩存）
   *
   * GET /api/performances/stats/category-revenue?startDate=2026-01-01&endDate=2026-12-31
   */
  @Get('/stats/category-revenue', { summary: '獲取門店分類營業額統計' })
  async getCategoryRevenueStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<Array<{
    categoryId: number;
    categoryName: string;
    amount: number;
    ratio: number;
  }>> {
    const shopId: number = this.ctx.state.shopId;
    const cacheKey = `${PerformanceCacheKey.DAILY}category:${shopId}:${startDate}:${endDate}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      PerformanceCacheKey.DAILY,
      `category:${shopId}:${startDate}:${endDate}`,
      () => this.performanceService.getCategoryRevenueStats(shopId, startDate, endDate),
      300
    );
    return result || [];
  }

  /**
   * 獲取門店年度營業額統計（含月度明細與同比增幅）
   *
   * GET /api/performances/stats/yearly?year=2026
   */
  @Get('/stats/yearly', { summary: '獲取門店年度營業額統計' })
  async getYearlyRevenueStats(
    @Query('year') year: number
  ): Promise<{
    year: number;
    totalAmount: number;
    monthlyData: number[];
    growthRate: number;
  }> {
    const shopId: number = this.ctx.state.shopId;
    const targetYear = year || new Date().getFullYear();
    const cacheKey = `${PerformanceCacheKey.DAILY}yearly:${shopId}:${targetYear}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      PerformanceCacheKey.DAILY,
      `yearly:${shopId}:${targetYear}`,
      () => this.performanceService.getYearlyRevenueStats(shopId, targetYear),
      300
    );
    if (!result) {
      return {
        year: targetYear,
        totalAmount: 0,
        monthlyData: new Array(12).fill(0),
        growthRate: 0,
      };
    }
    return result;
  }
}
