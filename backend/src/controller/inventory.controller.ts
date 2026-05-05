// ============================================================================
// 美業 SaaS 智慧管理系統 — 庫存控制器
// ============================================================================
// 功能：庫存管理、入庫、出庫、盤點、統計
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { InventoryService } from '../service/InventoryService';
import { Inventory } from '../entity/Inventory';
import { CacheService } from '../redis/cache.service';
import { LockService } from '../redis/lock.service';
import { CacheGuardService } from '../redis/guard.service';
import { LockKey } from '../redis/types';
import { managerOnly } from '../middleware/role.middleware';

const INVENTORY_CACHE_PREFIX = 'inv:';

@Controller('/inventories', {
  tagName: '庫存',
  description: '庫存管理接口',
})
export class InventoryController {
  @Inject()
  inventoryService: InventoryService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  lockService: LockService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢庫存記錄（含緩存）
   *
   * GET /api/inventories/:id
   */
  @Get('/:id', { summary: '查詢庫存記錄' })
  async findById(@Param('id') id: number): Promise<Inventory> {
    const cacheKey = `${INVENTORY_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<Inventory>(
      cacheKey,
      INVENTORY_CACHE_PREFIX,
      id,
      () => this.inventoryService.findById(id),
      300
    );
    if (!result) throw new Error('庫存記錄不存在');
    return result;
  }

  /**
   * 根據商品 ID 查詢庫存
   *
   * GET /api/inventories/by-product/:productId
   */
  @Get('/by-product/:productId', { summary: '根據商品 ID 查詢庫存' })
  async findByProductId(
    @Param('productId') productId: number
  ): Promise<Inventory[]> {
    const cacheKey = `${INVENTORY_CACHE_PREFIX}product:${productId}`;
    const result = await this.cacheGuardService.safeQuery<Inventory[]>(
      cacheKey,
      INVENTORY_CACHE_PREFIX,
      `product:${productId}`,
      () => this.inventoryService.findByProductId(productId),
      300
    );
    return result || [];
  }

  /**
   * 查詢低庫存商品
   *
   * GET /api/inventories/low-stock
   */
  @Get('/low-stock', { summary: '查詢低庫存商品' })
  async findLowStock(): Promise<Inventory[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.inventoryService.findLowStock(shopId);
  }

  /**
   * 查詢即將過期庫存
   *
   * GET /api/inventories/expiring?days=30
   */
  @Get('/expiring', { summary: '查詢即將過期庫存' })
  async findExpiringSoon(
    @Query('days') days?: number
  ): Promise<Inventory[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.inventoryService.findExpiringSoon(shopId, days);
  }

  /**
   * 獲取庫存統計（含緩存）
   *
   * GET /api/inventories/stats
   */
  @Get('/stats', { summary: '獲取庫存統計' })
  async getInventoryStats(): Promise<{
    totalProducts: number;
    totalQuantity: number;
    lowStockCount: number;
    expiringCount: number;
  }> {
    const shopId: number = this.ctx.state.shopId;
    const cacheKey = `${INVENTORY_CACHE_PREFIX}stats:${shopId}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      INVENTORY_CACHE_PREFIX,
      `stats:${shopId}`,
      () => this.inventoryService.getInventoryStats(shopId),
      120
    );
    if (!result) {
      return { totalProducts: 0, totalQuantity: 0, lowStockCount: 0, expiringCount: 0 };
    }
    return result;
  }

  /**
   * 入庫（使用分布式鎖防止並發）
   *
   * POST /api/inventories/inbound
   */
  @Post('/inbound', {
    summary: '入庫',
    middleware: ['authMiddleware'],
  })
  async inbound(
    @Body()
    body: {
      productId: number;
      batchNo?: string;
      quantity: number;
      unit: string;
      costPrice: number;
      sellingPrice?: number;
      expiryDate?: string;
      remark?: string;
    }
  ): Promise<Inventory> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.lockService.withLock(
      `${LockKey.INVENTORY_PICK}${shopId}:${body.productId}`,
      () => this.inventoryService.inbound({ shopId, ...body }),
      { timeout: 5000, retryInterval: 200, maxRetries: 3 }
    );
    if (!result) throw new Error('入庫操作失敗，請稍後重試');
    await this.cacheService.delByPattern(`${INVENTORY_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 出庫（使用分布式鎖防止超賣）
   *
   * POST /api/inventories/outbound
   */
  @Post('/outbound', {
    summary: '出庫',
    middleware: ['authMiddleware'],
  })
  async outbound(
    @Body()
    body: {
      productId: number;
      quantity: number;
      unit: string;
      remark?: string;
    }
  ): Promise<{ message: string }> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.lockService.withLock(
      `${LockKey.INVENTORY_PICK}${shopId}:${body.productId}`,
      () => this.inventoryService.outbound({ shopId, ...body }),
      { timeout: 5000, retryInterval: 200, maxRetries: 3 }
    );
    if (!result) throw new Error('出庫操作失敗，請稍後重試');
    await this.cacheService.delByPattern(`${INVENTORY_CACHE_PREFIX}*`);
    return { message: '出庫成功' };
  }

  /**
   * 庫存盤點（使用分布式鎖）
   *
   * POST /api/inventories/check
   */
  @Post('/check', {
    summary: '庫存盤點',
    middleware: ['authMiddleware'],
  })
  async check(
    @Body()
    body: {
      items: Array<{
        inventoryId: number;
        actualQuantity: number;
      }>;
    }
  ): Promise<{ message: string }> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.lockService.withLock(
      `${LockKey.INVENTORY_CHECK}${shopId}`,
      () => this.inventoryService.check({ shopId, items: body.items }),
      { timeout: 10000, retryInterval: 200, maxRetries: 3 }
    );
    if (!result) throw new Error('盤點操作失敗，請稍後重試');
    await this.cacheService.delByPattern(`${INVENTORY_CACHE_PREFIX}*`);
    return { message: '盤點完成' };
  }
}
