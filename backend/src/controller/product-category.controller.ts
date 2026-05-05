// ============================================================================
// 美業 SaaS 智慧管理系統 — 產品分類控制器
// ============================================================================
// 功能：產品分類的 CRUD 接口
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Del,
  Body,
  Param,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ProductCategoryService } from '../service/ProductCategoryService';
import { ProductCategory } from '../entity/ProductCategory';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';

const PROD_CAT_CACHE_PREFIX = 'prod_cat:';

@Controller('/product-categories', {
  tagName: '產品分類',
  description: '產品分類的 CRUD 接口',
})
export class ProductCategoryController {
  @Inject()
  productCategoryService: ProductCategoryService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢產品分類（含緩存）
   *
   * GET /api/product-categories/:id
   */
  @Get('/:id', { summary: '查詢產品分類' })
  async findById(@Param('id') id: number): Promise<ProductCategory> {
    const cacheKey = `${PROD_CAT_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<ProductCategory>(
      cacheKey,
      PROD_CAT_CACHE_PREFIX,
      id,
      () => this.productCategoryService.findById(id),
      600
    );
    if (!result) throw new Error('產品分類不存在');
    return result;
  }

  /**
   * 查詢當前門店的所有產品分類
   *
   * GET /api/product-categories
   */
  @Get('/', { summary: '查詢產品分類列表' })
  async findByShopId(): Promise<ProductCategory[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.productCategoryService.findByShopId(shopId);
  }

  /**
   * 查詢啟用中的產品分類
   *
   * GET /api/product-categories/active
   */
  @Get('/active', { summary: '查詢啟用中的產品分類' })
  async findActive(): Promise<ProductCategory[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.productCategoryService.findActiveByShopId(shopId);
  }

  /**
   * 創建產品分類
   *
   * POST /api/product-categories
   */
  @Post('/', { summary: '創建產品分類', middleware: ['authMiddleware'] })
  async create(
    @Body() body: { name: string; sortOrder?: number; status?: number }
  ): Promise<ProductCategory> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.productCategoryService.create({
      shopId,
      name: body.name,
      sortOrder: body.sortOrder,
      status: body.status,
    });
    await this.cacheService.delByPattern(`${PROD_CAT_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 更新產品分類
   *
   * PUT /api/product-categories/:id
   */
  @Put('/:id', { summary: '更新產品分類', middleware: ['authMiddleware'] })
  async update(
    @Param('id') id: number,
    @Body() body: Partial<ProductCategory>
  ): Promise<ProductCategory> {
    const result = await this.productCategoryService.update(id, body);
    await this.cacheService.delByPattern(`${PROD_CAT_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 刪除產品分類
   *
   * DELETE /api/product-categories/:id
   */
  @Del('/:id', { summary: '刪除產品分類', middleware: ['authMiddleware'] })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.productCategoryService.delete(id);
    await this.cacheService.delByPattern(`${PROD_CAT_CACHE_PREFIX}*`);
    return { message: '刪除成功' };
  }
}
