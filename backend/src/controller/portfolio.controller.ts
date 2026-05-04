// ============================================================================
// 美業 SaaS 智慧管理系統 — 作品集控制器
// ============================================================================
// 功能：作品集管理接口（集成 Redis 緩存）
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
import { PortfolioService } from '../service/PortfolioService';
import { Portfolio } from '../entity/Portfolio';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';

const PORTFOLIO_CACHE_PREFIX = 'port:';

@Controller('/api/portfolios', {
  tagName: '作品集',
  description: '作品集管理接口',
})
export class PortfolioController {
  @Inject()
  portfolioService: PortfolioService;

  @Inject()
  ctx: Context;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  /**
   * 根據 ID 查詢作品
   *
   * GET /api/portfolios/:id
   */
  @Get('/:id', { summary: '查詢作品' })
  async findById(@Param('id') id: number): Promise<Portfolio> {
    const cacheKey = `${PORTFOLIO_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<Portfolio>(
      cacheKey, PORTFOLIO_CACHE_PREFIX, id,
      () => this.portfolioService.findById(id), 600
    );
    if (!result) throw new Error('作品不存在');
    return result;
  }

  /**
   * 查詢當前門店的作品（分頁）
   *
   * GET /api/portfolios?page=1&pageSize=20
   */
  @Get('/', { summary: '查詢作品列表' })
  async findByShopId(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Portfolio[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.portfolioService.findByShopId(shopId, page, pageSize);
  }

  /**
   * 根據美容師查詢作品
   *
   * GET /api/portfolios/by-staff/:staffId
   */
  @Get('/by-staff/:staffId', { summary: '根據美容師查詢作品' })
  async findByStaffId(
    @Param('staffId') staffId: number
  ): Promise<Portfolio[]> {
    return this.portfolioService.findByStaffId(staffId);
  }

  /**
   * 根據媒體類型查詢
   *
   * GET /api/portfolios/media-type/:mediaType
   */
  @Get('/media-type/:mediaType', { summary: '根據媒體類型查詢' })
  async findByMediaType(
    @Param('mediaType') mediaType: 'image' | 'video'
  ): Promise<Portfolio[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.portfolioService.findByMediaType(shopId, mediaType);
  }

  /**
   * 創建作品
   *
   * POST /api/portfolios
   */
  @Post('/', { summary: '創建作品', middleware: ['authMiddleware'] })
  async create(
    @Body()
    body: {
      mediaType: 'image' | 'video';
      url: string;
      thumbnailUrl?: string;
      title?: string;
      description?: string;
      serviceIds?: number[];
    }
  ): Promise<Portfolio> {
    const shopId: number = this.ctx.state.shopId;
    const staffId: number = this.ctx.state.staffId;
    const result = await this.portfolioService.create({ shopId, staffId, ...body });
    await this.cacheService.delByPattern(`${PORTFOLIO_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 更新作品
   *
   * PUT /api/portfolios/:id
   */
  @Put('/:id', { summary: '更新作品', middleware: ['authMiddleware'] })
  async update(
    @Param('id') id: number,
    @Body() body: Partial<Portfolio>
  ): Promise<Portfolio> {
    const result = await this.portfolioService.update(id, body);
    await this.cacheService.delByPattern(`${PORTFOLIO_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 刪除作品
   *
   * DELETE /api/portfolios/:id
   */
  @Del('/:id', { summary: '刪除作品', middleware: ['authMiddleware'] })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.portfolioService.delete(id);
    await this.cacheService.delByPattern(`${PORTFOLIO_CACHE_PREFIX}*`);
    return { message: '刪除成功' };
  }
}
