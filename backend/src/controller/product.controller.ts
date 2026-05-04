// ============================================================================
// 美業 SaaS 智慧管理系統 — 產品控制器
// ============================================================================
// 功能：產品的 CRUD 接口（集成 Redis 緩存）
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
import { ProductService } from '../service/ProductService';
import { Product } from '../entity/Product';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';

const PRODUCT_CACHE_PREFIX = 'prod:';

@Controller('/api/products', {
  tagName: '產品',
  description: '產品的 CRUD 接口',
})
export class ProductController {
  @Inject()
  productService: ProductService;

  @Inject()
  ctx: Context;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  /**
   * 根據 ID 查詢產品
   *
   * GET /api/products/:id
   */
  @Get('/:id', { summary: '查詢產品' })
  async findById(@Param('id') id: number): Promise<Product> {
    const cacheKey = `${PRODUCT_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<Product>(
      cacheKey, PRODUCT_CACHE_PREFIX, id,
      () => this.productService.findById(id), 600
    );
    if (!result) throw new Error('產品不存在');
    return result;
  }

  /**
   * 查詢當前門店的所有產品
   *
   * GET /api/products
   */
  @Get('/', { summary: '查詢產品列表' })
  async findByShopId(): Promise<Product[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.productService.findByShopId(shopId);
  }

  /**
   * 根據分類查詢產品
   *
   * GET /api/products/by-category/:categoryId
   */
  @Get('/by-category/:categoryId', { summary: '根據分類查詢產品' })
  async findByCategoryId(
    @Param('categoryId') categoryId: number
  ): Promise<Product[]> {
    return this.productService.findByCategoryId(categoryId);
  }

  /**
   * 搜索產品
   *
   * GET /api/products/search?keyword=xxx
   */
  @Get('/search', { summary: '搜索產品' })
  async search(@Query('keyword') keyword: string): Promise<Product[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.productService.search(shopId, keyword);
  }

  /**
   * 查詢低庫存產品
   *
   * GET /api/products/low-stock
   */
  @Get('/low-stock', { summary: '查詢低庫存產品' })
  async findLowStock(): Promise<Product[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.productService.findLowStock(shopId);
  }

  /**
   * 創建產品
   *
   * POST /api/products
   */
  @Post('/', { summary: '創建產品', middleware: ['authMiddleware'] })
  async create(
    @Body()
    body: {
      categoryId?: number;
      name: string;
      barcode?: string;
      brand?: string;
      specification?: string;
      unit?: string;
      costPrice?: number;
      sellingPrice: number;
      commissionType?: 'fixed' | 'percent';
      commissionValue?: number;
      status?: number;
    }
  ): Promise<Product> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.productService.create({ shopId, ...body });
    await this.cacheService.delByPattern(`${PRODUCT_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 更新產品
   *
   * PUT /api/products/:id
   */
  @Put('/:id', { summary: '更新產品', middleware: ['authMiddleware'] })
  async update(
    @Param('id') id: number,
    @Body() body: Partial<Product>
  ): Promise<Product> {
    const result = await this.productService.update(id, body);
    await this.cacheService.delByPattern(`${PRODUCT_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 刪除產品
   *
   * DELETE /api/products/:id
   */
  @Del('/:id', { summary: '刪除產品', middleware: ['authMiddleware'] })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.productService.delete(id);
    await this.cacheService.delByPattern(`${PRODUCT_CACHE_PREFIX}*`);
    return { message: '刪除成功' };
  }
}
