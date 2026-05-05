// ============================================================================
// 美業 SaaS 智慧管理系統 — 領料單控制器
// ============================================================================
// 功能：領料單管理、審批、完成
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
import { PickOrderService } from '../service/PickOrderService';
import { PickOrder } from '../entity/PickOrder';
import { CacheService } from '../redis/cache.service';
import { LockService } from '../redis/lock.service';
import { CacheGuardService } from '../redis/guard.service';
import { LockKey } from '../redis/types';

const PICK_ORDER_CACHE_PREFIX = 'pick:';

@Controller('/pick-orders', {
  tagName: '領料單',
  description: '領料單管理接口',
})
export class PickOrderController {
  @Inject()
  pickOrderService: PickOrderService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  lockService: LockService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢領料單（含緩存）
   *
   * GET /api/pick-orders/:id
   */
  @Get('/:id', { summary: '查詢領料單' })
  async findById(@Param('id') id: number): Promise<PickOrder> {
    const cacheKey = `${PICK_ORDER_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<PickOrder>(
      cacheKey,
      PICK_ORDER_CACHE_PREFIX,
      id,
      () => this.pickOrderService.findById(id),
      300
    );
    if (!result) throw new Error('領料單不存在');
    return result;
  }

  /**
   * 根據領料單號查詢（含緩存）
   *
   * GET /api/pick-orders/no/:pickNo
   */
  @Get('/no/:pickNo', { summary: '根據領料單號查詢' })
  async findByPickNo(
    @Param('pickNo') pickNo: string
  ): Promise<PickOrder> {
    const cacheKey = `${PICK_ORDER_CACHE_PREFIX}no:${pickNo}`;
    const result = await this.cacheGuardService.safeQuery<PickOrder>(
      cacheKey,
      PICK_ORDER_CACHE_PREFIX,
      `no:${pickNo}`,
      () => this.pickOrderService.findByPickNo(pickNo),
      300
    );
    if (!result) throw new Error('領料單不存在');
    return result;
  }

  /**
   * 查詢當前門店的領料單（分頁）
   *
   * GET /api/pick-orders?page=1&pageSize=20
   */
  @Get('/', { summary: '查詢領料單列表' })
  async findByShopId(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: PickOrder[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.pickOrderService.findByShopId(shopId, page, pageSize);
  }

  /**
   * 根據狀態查詢領料單
   *
   * GET /api/pick-orders/status/:status
   */
  @Get('/status/:status', { summary: '根據狀態查詢領料單' })
  async findByStatus(
    @Param('status')
    status: 'pending' | 'approved' | 'rejected' | 'completed'
  ): Promise<PickOrder[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.pickOrderService.findByStatus(shopId, status);
  }

  /**
   * 獲取領料明細（含緩存）
   *
   * GET /api/pick-orders/:id/items
   */
  @Get('/:id/items', { summary: '獲取領料明細' })
  async getItems(@Param('id') id: number) {
    const cacheKey = `${PICK_ORDER_CACHE_PREFIX}items:${id}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      PICK_ORDER_CACHE_PREFIX,
      `items:${id}`,
      () => this.pickOrderService.getItems(id),
      300
    );
    return result || [];
  }

  /**
   * 創建領料單（使用分布式鎖防止庫存超領）
   *
   * POST /api/pick-orders
   */
  @Post('/', {
    summary: '創建領料單',
    middleware: ['authMiddleware'],
  })
  async create(
    @Body()
    body: {
      items: Array<{
        productId: number;
        inventoryId: number;
        quantity: number;
        unit: string;
      }>;
      remark?: string;
    }
  ): Promise<PickOrder> {
    const shopId: number = this.ctx.state.shopId;
    const staffId: number = this.ctx.state.staffId;
    const result = await this.lockService.withLock(
      `${LockKey.INVENTORY_PICK}${shopId}:${body.items[0]?.productId || 'batch'}`,
      () => this.pickOrderService.create({ shopId, staffId, ...body }),
      { timeout: 5000, retryInterval: 200, maxRetries: 3 }
    );
    if (!result) throw new Error('領料單創建失敗，請稍後重試');
    await this.cacheService.delByPattern(`${PICK_ORDER_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 審批領料單
   *
   * POST /api/pick-orders/:id/approve
   */
  @Post('/:id/approve', {
    summary: '審批領料單',
    middleware: ['authMiddleware'],
  })
  async approve(
    @Param('id') id: number,
    @Body() body: { status: 'approved' | 'rejected' }
  ): Promise<PickOrder> {
    const approvedBy: number = this.ctx.state.staffId;
    const result = await this.pickOrderService.approve(id, approvedBy, body.status);
    await this.cacheService.delByPattern(`${PICK_ORDER_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 完成領料單
   *
   * POST /api/pick-orders/:id/complete
   */
  @Post('/:id/complete', {
    summary: '完成領料單',
    middleware: ['authMiddleware'],
  })
  async complete(@Param('id') id: number): Promise<PickOrder> {
    const result = await this.pickOrderService.complete(id);
    await this.cacheService.delByPattern(`${PICK_ORDER_CACHE_PREFIX}*`);
    return result;
  }
}
