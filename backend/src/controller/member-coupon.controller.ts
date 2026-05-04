// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員票券控制器
// ============================================================================
// 功能：會員持有的票券查詢、使用、取消使用
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { MemberCouponService } from '../service/MemberCouponService';
import { MemberCoupon } from '../entity/MemberCoupon';
import { CacheService } from '../redis/cache.service';
import { LockService } from '../redis/lock.service';
import { CacheGuardService } from '../redis/guard.service';
import { LockKey } from '../redis/types';

const MEMBER_COUPON_CACHE_PREFIX = 'mc:';

@Controller('/api/member-coupons', {
  tagName: '會員票券',
  description: '會員持有的票券查詢與使用',
})
export class MemberCouponController {
  @Inject()
  memberCouponService: MemberCouponService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  lockService: LockService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢會員票券（含緩存）
   *
   * GET /api/member-coupons/:id
   */
  @Get('/:id', { summary: '查詢會員票券' })
  async findById(@Param('id') id: number): Promise<MemberCoupon> {
    const cacheKey = `${MEMBER_COUPON_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<MemberCoupon>(
      cacheKey,
      MEMBER_COUPON_CACHE_PREFIX,
      id,
      () => this.memberCouponService.findById(id),
      300
    );
    if (!result) throw new Error('票券不存在');
    return result;
  }

  /**
   * 查詢會員的所有票券
   *
   * GET /api/member-coupons/by-member/:memberId
   */
  @Get('/by-member/:memberId', { summary: '查詢會員的所有票券' })
  async findByMemberId(
    @Param('memberId') memberId: number
  ): Promise<MemberCoupon[]> {
    return this.memberCouponService.findByMemberId(memberId);
  }

  /**
   * 查詢會員的可用票券
   *
   * GET /api/member-coupons/valid/:memberId
   */
  @Get('/valid/:memberId', { summary: '查詢會員的可用票券' })
  async findValidByMemberId(
    @Param('memberId') memberId: number
  ): Promise<MemberCoupon[]> {
    return this.memberCouponService.findValidByMemberId(memberId);
  }

  /**
   * 根據票券編號查詢（含緩存）
   *
   * GET /api/member-coupons/code/:code
   */
  @Get('/code/:code', { summary: '根據票券編號查詢' })
  async findByCode(@Param('code') code: string): Promise<MemberCoupon> {
    const cacheKey = `${MEMBER_COUPON_CACHE_PREFIX}code:${code}`;
    const result = await this.cacheGuardService.safeQuery<MemberCoupon>(
      cacheKey,
      MEMBER_COUPON_CACHE_PREFIX,
      `code:${code}`,
      () => this.memberCouponService.findByCode(code),
      300
    );
    if (!result) throw new Error('票券不存在');
    return result;
  }

  /**
   * 使用票券（使用分布式鎖防止重複使用）
   *
   * POST /api/member-coupons/:id/use
   */
  @Post('/:id/use', {
    summary: '使用票券',
    middleware: ['authMiddleware'],
  })
  async use(
    @Param('id') id: number,
    @Body() body: { appointmentId: number }
  ): Promise<{ message: string }> {
    const result = await this.lockService.withLock(
      `${LockKey.MEMBER_ASSET}${id}`,
      () => this.memberCouponService.use(id, body.appointmentId),
      { timeout: 5000, retryInterval: 200, maxRetries: 3 }
    );
    if (!result) throw new Error('票券使用失敗，請稍後重試');
    await this.cacheService.delByPattern(`${MEMBER_COUPON_CACHE_PREFIX}*`);
    return { message: '使用成功' };
  }

  /**
   * 取消使用票券（使用分布式鎖）
   *
   * POST /api/member-coupons/:id/cancel-use
   */
  @Post('/:id/cancel-use', {
    summary: '取消使用票券',
    middleware: ['authMiddleware'],
  })
  async cancelUse(@Param('id') id: number): Promise<{ message: string }> {
    const result = await this.lockService.withLock(
      `${LockKey.MEMBER_ASSET}${id}`,
      () => this.memberCouponService.cancelUse(id),
      { timeout: 5000, retryInterval: 200, maxRetries: 3 }
    );
    if (!result) throw new Error('取消失敗，請稍後重試');
    await this.cacheService.delByPattern(`${MEMBER_COUPON_CACHE_PREFIX}*`);
    return { message: '取消成功' };
  }

  /**
   * 手動標記過期票券
   *
   * POST /api/member-coupons/mark-expired
   */
  @Post('/mark-expired', {
    summary: '標記過期票券',
    middleware: ['authMiddleware'],
  })
  async markExpired(): Promise<{ count: number }> {
    const count = await this.memberCouponService.markExpired();
    await this.cacheService.delByPattern(`${MEMBER_COUPON_CACHE_PREFIX}*`);
    return { count };
  }
}
