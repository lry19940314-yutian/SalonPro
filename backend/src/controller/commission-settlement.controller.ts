// ============================================================================
// 美業 SaaS 智慧管理系統 — 佣金結算控制器
// ============================================================================
// 功能：佣金結算管理、確認、付款
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Del,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { CommissionSettlementService } from '../service/CommissionSettlementService';
import { CommissionSettlement } from '../entity/CommissionSettlement';
import { CacheService } from '../redis/cache.service';
import { LockService } from '../redis/lock.service';
import { CacheGuardService } from '../redis/guard.service';
import { LockKey } from '../redis/types';

const SETTLEMENT_CACHE_PREFIX = 'settle:';

@Controller('/api/commission-settlements', {
  tagName: '佣金結算',
  description: '佣金結算管理接口',
})
export class CommissionSettlementController {
  @Inject()
  commissionSettlementService: CommissionSettlementService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  lockService: LockService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢結算記錄（含緩存）
   *
   * GET /api/commission-settlements/:id
   */
  @Get('/:id', { summary: '查詢結算記錄' })
  async findById(@Param('id') id: number): Promise<CommissionSettlement> {
    const cacheKey = `${SETTLEMENT_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<CommissionSettlement>(
      cacheKey,
      SETTLEMENT_CACHE_PREFIX,
      id,
      () => this.commissionSettlementService.findById(id),
      300
    );
    if (!result) throw new Error('結算記錄不存在');
    return result;
  }

  /**
   * 查詢當前門店的結算記錄（分頁）
   *
   * GET /api/commission-settlements?page=1&pageSize=20
   */
  @Get('/', { summary: '查詢結算記錄列表' })
  async findByShopId(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: CommissionSettlement[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.commissionSettlementService.findByShopId(
      shopId,
      page,
      pageSize
    );
  }

  /**
   * 根據狀態查詢結算記錄
   *
   * GET /api/commission-settlements/status/:status
   */
  @Get('/status/:status', { summary: '根據狀態查詢結算記錄' })
  async findByStatus(
    @Param('status') status: 'pending' | 'confirmed' | 'paid'
  ): Promise<CommissionSettlement[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.commissionSettlementService.findByStatus(shopId, status);
  }

  /**
   * 創建結算（使用分布式鎖防止重複結算）
   *
   * POST /api/commission-settlements
   */
  @Post('/', {
    summary: '創建結算',
    middleware: ['authMiddleware'],
  })
  async create(
    @Body()
    body: {
      staffId: number;
      periodStart: string;
      periodEnd: string;
      commissionIds: number[];
      bonusAmount?: number;
      deductionAmount?: number;
      bonusDescription?: string;
      deductionDescription?: string;
    }
  ): Promise<CommissionSettlement> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.lockService.withLock(
      `${LockKey.PERFORMANCE_SETTLE}${body.staffId}:${body.periodStart}`,
      () => this.commissionSettlementService.create({ shopId, ...body }),
      { timeout: 5000, retryInterval: 200, maxRetries: 3 }
    );
    if (!result) throw new Error('結算創建失敗，請稍後重試');
    await this.cacheService.delByPattern(`${SETTLEMENT_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 確認結算
   *
   * POST /api/commission-settlements/:id/confirm
   */
  @Post('/:id/confirm', {
    summary: '確認結算',
    middleware: ['authMiddleware'],
  })
  async confirm(@Param('id') id: number): Promise<CommissionSettlement> {
    const result = await this.commissionSettlementService.confirm(id);
    await this.cacheService.delByPattern(`${SETTLEMENT_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 標記為已付款
   *
   * POST /api/commission-settlements/:id/pay
   */
  @Post('/:id/pay', {
    summary: '標記為已付款',
    middleware: ['authMiddleware'],
  })
  async markAsPaid(@Param('id') id: number): Promise<CommissionSettlement> {
    const result = await this.commissionSettlementService.markAsPaid(id);
    await this.cacheService.delByPattern(`${SETTLEMENT_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 刪除結算記錄
   *
   * DELETE /api/commission-settlements/:id
   */
  @Del('/:id', {
    summary: '刪除結算記錄',
    middleware: ['authMiddleware'],
  })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.commissionSettlementService.delete(id);
    await this.cacheService.delByPattern(`${SETTLEMENT_CACHE_PREFIX}*`);
    return { message: '刪除成功' };
  }
}
