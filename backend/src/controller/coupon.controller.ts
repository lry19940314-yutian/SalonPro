// ============================================================================
// 美業 SaaS 智慧管理系統 — 票券定義控制器
// ============================================================================
// 功能：票券定義的 CRUD、發放接口
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
import { CouponService } from '../service/CouponService';
import { Coupon } from '../entity/Coupon';
import { CacheService } from '../redis/cache.service';
import { LockService } from '../redis/lock.service';
import { CacheGuardService } from '../redis/guard.service';
import { managerOnly } from '../middleware/role.middleware';

const COUPON_CACHE_PREFIX = 'coupon:';

@Controller('/coupons', {
  tagName: '票券定義',
  description: '票券定義的 CRUD 接口',
})
export class CouponController {
  @Inject()
  couponService: CouponService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  lockService: LockService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢票券定義（含緩存）
   *
   * GET /api/coupons/:id
   */
  @Get('/:id', { summary: '查詢票券定義' })
  async findById(@Param('id') id: number): Promise<Coupon> {
    const cacheKey = `${COUPON_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<Coupon>(
      cacheKey,
      COUPON_CACHE_PREFIX,
      id,
      () => this.couponService.findById(id),
      600
    );
    if (!result) throw new Error('票券定義不存在');
    return result;
  }

  /**
   * 查詢當前門店的所有票券定義
   *
   * GET /api/coupons
   */
  @Get('/', { summary: '查詢票券定義列表' })
  async findByShopId(): Promise<Coupon[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.couponService.findByShopId(shopId);
  }

  /**
   * 查詢有效的票券定義
   *
   * GET /api/coupons/valid
   */
  @Get('/valid', { summary: '查詢有效的票券定義' })
  async findValid(): Promise<Coupon[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.couponService.findValid(shopId);
  }

  /**
   * 創建票券定義
   *
   * POST /api/coupons
   */
  @Post('/', { summary: '創建票券定義', middleware: ['authMiddleware'] })
  async create(
    @Body()
    body: {
      name: string;
      type: 'discount' | 'deduction' | 'gift';
      value: number;
      conditionAmount?: number;
      validDays?: number;
      validStart?: string;
      validEnd?: string;
      totalQuantity?: number;
      description?: string;
    }
  ): Promise<Coupon> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.couponService.create({ shopId, ...body });
    await this.cacheService.delByPattern(`${COUPON_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 更新票券定義
   *
   * PUT /api/coupons/:id
   */
  @Put('/:id', { summary: '更新票券定義', middleware: ['authMiddleware'] })
  async update(
    @Param('id') id: number,
    @Body() body: Partial<Coupon>
  ): Promise<Coupon> {
    const result = await this.couponService.update(id, body);
    await this.cacheService.delByPattern(`${COUPON_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 刪除票券定義
   *
   * DELETE /api/coupons/:id
   */
  @Del('/:id', { summary: '刪除票券定義', middleware: ['authMiddleware'] })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.couponService.delete(id);
    await this.cacheService.delByPattern(`${COUPON_CACHE_PREFIX}*`);
    return { message: '刪除成功' };
  }

  /**
   * 發放票券給會員（使用分布式鎖防止重複發放）
   *
   * POST /api/coupons/:id/issue
   */
  @Post('/:id/issue', {
    summary: '發放票券給會員',
    middleware: ['authMiddleware'],
  })
  async issueToMember(
    @Param('id') id: number,
    @Body() body: { memberId: number; quantity?: number }
  ): Promise<{ message: string }> {
    const result = await this.lockService.withLock(
      `coupon:issue:${id}:${body.memberId}`,
      () => this.couponService.issueToMember(id, body.memberId, body.quantity),
      { timeout: 5000, retryInterval: 200, maxRetries: 3 }
    );
    if (!result) throw new Error('發放失敗，請稍後重試');
    return { message: '發放成功' };
  }
}
