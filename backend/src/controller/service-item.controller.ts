// ============================================================================
// 美業 SaaS 智慧管理系統 — 服務項目控制器
// ============================================================================
// 功能：服務項目的 CRUD 接口
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
import { ServiceItemService } from '../service/ServiceItemService';
import { ServiceItem } from '../entity/ServiceItem';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';

const SERVICE_ITEM_CACHE_PREFIX = 'svc_item:';

@Controller('/service-items', {
  tagName: '服務項目',
  description: '服務項目的 CRUD 接口',
})
export class ServiceItemController {
  @Inject()
  serviceItemService: ServiceItemService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢服務項目（含緩存）
   *
   * GET /api/service-items/:id
   */
  @Get('/:id', { summary: '查詢服務項目' })
  async findById(@Param('id') id: number): Promise<ServiceItem> {
    const cacheKey = `${SERVICE_ITEM_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<ServiceItem>(
      cacheKey,
      SERVICE_ITEM_CACHE_PREFIX,
      id,
      () => this.serviceItemService.findById(id),
      600
    );
    if (!result) throw new Error('服務項目不存在');
    return result;
  }

  /**
   * 查詢當前門店的所有服務項目
   *
   * GET /api/service-items
   */
  @Get('/', { summary: '查詢服務項目列表' })
  async findByShopId(): Promise<ServiceItem[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.serviceItemService.findByShopId(shopId);
  }

  /**
   * 根據分類查詢服務項目
   *
   * GET /api/service-items/by-category/:categoryId
   */
  @Get('/by-category/:categoryId', { summary: '根據分類查詢服務項目' })
  async findByCategoryId(
    @Param('categoryId') categoryId: number
  ): Promise<ServiceItem[]> {
    return this.serviceItemService.findByCategoryId(categoryId);
  }

  /**
   * 查詢啟用中的服務項目
   *
   * GET /api/service-items/active
   */
  @Get('/active', { summary: '查詢啟用中的服務項目' })
  async findActive(): Promise<ServiceItem[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.serviceItemService.findActiveByShopId(shopId);
  }

  /**
   * 搜索服務項目
   *
   * GET /api/service-items/search?keyword=xxx
   */
  @Get('/search', { summary: '搜索服務項目' })
  async search(@Query('keyword') keyword: string): Promise<ServiceItem[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.serviceItemService.search(shopId, keyword);
  }

  /**
   * 創建服務項目
   *
   * POST /api/service-items
   */
  @Post('/', { summary: '創建服務項目', middleware: ['authMiddleware'] })
  async create(
    @Body()
    body: {
      categoryId: number;
      name: string;
      duration: number;
      price: number;
      color?: string;
      commissionType?: 'fixed' | 'percent';
      commissionValue?: number;
      sortOrder?: number;
      status?: number;
    }
  ): Promise<ServiceItem> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.serviceItemService.create({ shopId, ...body });
    await this.cacheService.delByPattern(`${SERVICE_ITEM_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 更新服務項目
   *
   * PUT /api/service-items/:id
   */
  @Put('/:id', { summary: '更新服務項目', middleware: ['authMiddleware'] })
  async update(
    @Param('id') id: number,
    @Body() body: Partial<ServiceItem>
  ): Promise<ServiceItem> {
    const result = await this.serviceItemService.update(id, body);
    await this.cacheService.delByPattern(`${SERVICE_ITEM_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 刪除服務項目
   *
   * DELETE /api/service-items/:id
   */
  @Del('/:id', { summary: '刪除服務項目', middleware: ['authMiddleware'] })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.serviceItemService.delete(id);
    await this.cacheService.delByPattern(`${SERVICE_ITEM_CACHE_PREFIX}*`);
    return { message: '刪除成功' };
  }
}
