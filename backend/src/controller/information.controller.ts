// ============================================================================
// 美業 SaaS 智慧管理系統 — 資訊中心控制器
// ============================================================================
// 功能：資訊中心總覽三大數據板塊
//   - GET /admin/information/yearly    門店年度營業額
//   - GET /admin/information/category  分類營業額
//   - GET /admin/information/staff     員工業績排行
// 數據庫表結構參考：database/README.md
//   - performance 表：業績記錄，按 shop_id + 日期聚合
//   - service_category 表：服務分類
//   - staff 表：員工資料
// ============================================================================

import {
  Controller,
  Get,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { PerformanceService } from '../service/PerformanceService';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';
import { PerformanceCacheKey } from '../redis/types';

@Controller('/admin/information', {
  tagName: '資訊中心',
  description: '資訊中心總覽數據接口',
})
export class InformationController {
  @Inject()
  performanceService: PerformanceService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 獲取門店年度營業額統計（含月度明細與同比增幅）
   *
   * GET /api/admin/information/yearly?year=2026
   *
   * 數據庫來源：
   * - performance 表：按 shop_id + YEAR(performance_date) 分組聚合 totalAmount
   * - 按 MONTH(performance_date) 分組計算 monthlyData
   * - 與去年同比計算 growthRate
   */
  @Get('/yearly', { summary: '門店年度營業額' })
  async getYearlyRevenue(
    @Query('year') year: number
  ): Promise<{
    year: number;
    totalAmount: number;
    monthlyData: number[];
    growthRate: number;
  }> {
    const shopId: number = this.ctx.state.shopId;
    const targetYear = year || new Date().getFullYear();
    const cacheKey = `${PerformanceCacheKey.DAILY}info:yearly:${shopId}:${targetYear}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      PerformanceCacheKey.DAILY,
      `info:yearly:${shopId}:${targetYear}`,
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

  /**
   * 獲取門店分類營業額統計
   *
   * GET /api/admin/information/category?startDate=2026-01-01&endDate=2026-12-31
   *
   * 數據庫來源：
   * - appointment_item 表：關聯 service_item.service_category_id
   * - service_category 表：分類名稱
   * - 按 service_category_id 分組聚合 amount
   */
  @Get('/category', { summary: '分類營業額' })
  async getCategoryRevenue(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<Array<{
    categoryId: number;
    categoryName: string;
    amount: number;
    ratio: number;
  }>> {
    const shopId: number = this.ctx.state.shopId;
    const cacheKey = `${PerformanceCacheKey.DAILY}info:category:${shopId}:${startDate}:${endDate}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      PerformanceCacheKey.DAILY,
      `info:category:${shopId}:${startDate}:${endDate}`,
      () => this.performanceService.getCategoryRevenueStats(shopId, startDate, endDate),
      300
    );
    return result || [];
  }

  /**
   * 獲取工作人員業績排行
   *
   * GET /api/admin/information/staff?startDate=2026-05-01&endDate=2026-05-31&limit=10
   *
   * 數據庫來源：
   * - performance 表：按 staff_id 分組聚合 amount
   * - staff 表：員工姓名 name
   * - percentage = 該員工金額 / 第一名金額 * 100
   */
  @Get('/staff', { summary: '員工業績排行' })
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
    const cacheKey = `${PerformanceCacheKey.DAILY}info:staffRanking:${shopId}:${startDate}:${endDate}:${rankingLimit}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      PerformanceCacheKey.DAILY,
      `info:staffRanking:${shopId}:${startDate}:${endDate}:${rankingLimit}`,
      () => this.performanceService.getStaffRanking(shopId, startDate, endDate, rankingLimit),
      120
    );
    return result || [];
  }
}
