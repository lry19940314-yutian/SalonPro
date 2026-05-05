// ============================================================================
// 美業 SaaS 智慧管理系統 — 庫存變動日誌控制器
// ============================================================================
// 功能：庫存變動記錄查詢（集成 Redis 緩存）
// ============================================================================

import {
  Controller,
  Get,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { InventoryLogService } from '../service/InventoryLogService';
import { InventoryLog } from '../entity/InventoryLog';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';

const INVENTORY_LOG_CACHE_PREFIX = 'inv_log:';

@Controller('/inventory-logs', {
  tagName: '庫存變動日誌',
  description: '庫存變動記錄查詢接口',
})
export class InventoryLogController {
  @Inject()
  inventoryLogService: InventoryLogService;

  @Inject()
  ctx: Context;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  /**
   * 根據 ID 查詢日誌
   *
   * GET /api/inventory-logs/:id
   */
  @Get('/:id', { summary: '查詢庫存變動日誌' })
  async findById(@Param('id') id: number): Promise<InventoryLog> {
    const cacheKey = `${INVENTORY_LOG_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<InventoryLog>(
      cacheKey, INVENTORY_LOG_CACHE_PREFIX, id,
      () => this.inventoryLogService.findById(id), 600
    );
    if (!result) throw new Error('庫存變動日誌不存在');
    return result;
  }

  /**
   * 查詢當前門店的庫存變動日誌（分頁）
   *
   * GET /api/inventory-logs?page=1&pageSize=20
   */
  @Get('/', { summary: '查詢庫存變動日誌列表' })
  async findByShopId(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: InventoryLog[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.inventoryLogService.findByShopId(shopId, page, pageSize);
  }

  /**
   * 根據庫存記錄 ID 查詢變動日誌
   *
   * GET /api/inventory-logs/by-inventory/:inventoryId?page=1&pageSize=20
   */
  @Get('/by-inventory/:inventoryId', { summary: '根據庫存記錄查詢變動日誌' })
  async findByInventoryId(
    @Param('inventoryId') inventoryId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: InventoryLog[]; total: number }> {
    return this.inventoryLogService.findByInventoryId(
      inventoryId,
      page,
      pageSize
    );
  }

  /**
   * 根據商品 ID 查詢變動日誌
   *
   * GET /api/inventory-logs/by-product/:productId?page=1&pageSize=20
   */
  @Get('/by-product/:productId', { summary: '根據商品查詢變動日誌' })
  async findByProductId(
    @Param('productId') productId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: InventoryLog[]; total: number }> {
    return this.inventoryLogService.findByProductId(productId, page, pageSize);
  }

  /**
   * 根據變動類型查詢
   *
   * GET /api/inventory-logs/type/:changeType?page=1&pageSize=20
   */
  @Get('/type/:changeType', { summary: '根據變動類型查詢' })
  async findByChangeType(
    @Param('changeType')
    changeType: 'inbound' | 'outbound' | 'pick' | 'return' | 'check' | 'adjustment',
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: InventoryLog[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.inventoryLogService.findByChangeType(
      shopId,
      changeType,
      page,
      pageSize
    );
  }
}
