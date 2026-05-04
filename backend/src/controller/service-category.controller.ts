// ============================================================================
// 美業 SaaS 智慧管理系統 — 服務分類控制器
// ============================================================================
// 功能：服務分類的 CRUD 接口
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
import { ServiceCategoryService } from '../service/ServiceCategoryService';
import { ServiceCategory } from '../entity/ServiceCategory';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';
import { managerOnly } from '../middleware/role.middleware';

const SERVICE_CAT_CACHE_PREFIX = 'svc_cat:';

@Controller('/api/service-categories', {
  tagName: '服務分類',
  description: '服務分類的 CRUD 接口',
})
export class ServiceCategoryController {
  @Inject()
  serviceCategoryService: ServiceCategoryService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢服務分類（含緩存）
   *
   * GET /api/service-categories/:id
   */
  @Get('/:id', { summary: '查詢服務分類' })
  async findById(@Param('id') id: number): Promise<ServiceCategory> {
    const cacheKey = `${SERVICE_CAT_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<ServiceCategory>(
      cacheKey,
      SERVICE_CAT_CACHE_PREFIX,
      id,
      () => this.serviceCategoryService.findById(id),
      600
    );
    if (!result) throw new Error('服務分類不存在');
    return result;
  }

  /**
   * 查詢當前門店的所有服務分類
   *
   * GET /api/service-categories
   */
  @Get('/', { summary: '查詢服務分類列表' })
  async findByShopId(): Promise<ServiceCategory[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.serviceCategoryService.findByShopId(shopId);
  }

  /**
   * 查詢啟用中的服務分類
   *
   * GET /api/service-categories/active
   */
  @Get('/active', { summary: '查詢啟用中的服務分類' })
  async findActive(): Promise<ServiceCategory[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.serviceCategoryService.findActiveByShopId(shopId);
  }

  /**
   * 創建服務分類
   *
   * POST /api/service-categories
   */
  @Post('/', { summary: '創建服務分類', middleware: ['authMiddleware'] })
  async create(
    @Body() body: { name: string; sortOrder?: number; status?: number }
  ): Promise<ServiceCategory> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.serviceCategoryService.create({
      shopId,
      name: body.name,
      sortOrder: body.sortOrder,
      status: body.status,
    });
    await this.cacheService.delByPattern(`${SERVICE_CAT_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 更新服務分類
   *
   * PUT /api/service-categories/:id
   */
  @Put('/:id', { summary: '更新服務分類', middleware: ['authMiddleware'] })
  async update(
    @Param('id') id: number,
    @Body() body: Partial<ServiceCategory>
  ): Promise<ServiceCategory> {
    const result = await this.serviceCategoryService.update(id, body);
    await this.cacheService.delByPattern(`${SERVICE_CAT_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 刪除服務分類
   *
   * DELETE /api/service-categories/:id
   */
  @Del('/:id', { summary: '刪除服務分類', middleware: ['authMiddleware'] })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.serviceCategoryService.delete(id);
    await this.cacheService.delByPattern(`${SERVICE_CAT_CACHE_PREFIX}*`);
    return { message: '刪除成功' };
  }
}
