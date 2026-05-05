// ============================================================================
// 美業 SaaS 智慧管理系統 — 操作日誌控制器
// ============================================================================
// 功能：操作日誌查詢接口（集成 Redis 緩存）
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
import { OperationLogService } from '../service/OperationLogService';
import { OperationLog } from '../entity/OperationLog';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';

const OPERATION_LOG_CACHE_PREFIX = 'op_log:';

@Controller('/operation-logs', {
  tagName: '操作日誌',
  description: '操作日誌查詢接口',
})
export class OperationLogController {
  @Inject()
  operationLogService: OperationLogService;

  @Inject()
  ctx: Context;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  /**
   * 根據 ID 查詢日誌
   *
   * GET /api/operation-logs/:id
   */
  @Get('/:id', { summary: '查詢操作日誌' })
  async findById(@Param('id') id: number): Promise<OperationLog | null> {
    const cacheKey = `${OPERATION_LOG_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<OperationLog>(
      cacheKey, OPERATION_LOG_CACHE_PREFIX, id,
      () => this.operationLogService.findById(id), 600
    );
    if (!result) return null;
    return result;
  }

  /**
   * 查詢當前門店的操作日誌（分頁）
   *
   * GET /api/operation-logs?page=1&pageSize=20
   */
  @Get('/', { summary: '查詢操作日誌列表' })
  async findByShopId(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: OperationLog[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.operationLogService.findByShopId(shopId, page, pageSize);
  }

  /**
   * 根據模塊查詢日誌
   *
   * GET /api/operation-logs/module/:module?page=1&pageSize=20
   */
  @Get('/module/:module', { summary: '根據模塊查詢日誌' })
  async findByModule(
    @Param('module') module: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: OperationLog[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.operationLogService.findByModule(shopId, module, page, pageSize);
  }

  /**
   * 記錄操作日誌
   *
   * POST /api/operation-logs
   */
  @Post('/', { summary: '記錄操作日誌', middleware: ['authMiddleware'] })
  async log(
    @Body()
    body: {
      module: string;
      action: string;
      targetType?: string;
      targetId?: number;
      detail?: Record<string, unknown>;
    }
  ): Promise<OperationLog> {
    const shopId: number = this.ctx.state.shopId;
    const staffId: number = this.ctx.state.staffId;
    const ipAddress: string = this.ctx.ip;
    const userAgent: string = this.ctx.headers['user-agent'] || '';
    const result = await this.operationLogService.log({
      shopId,
      staffId,
      ipAddress,
      userAgent,
      ...body,
    });
    await this.cacheService.delByPattern(`${OPERATION_LOG_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 清理指定日期之前的日誌
   *
   * POST /api/operation-logs/clean
   */
  @Post('/clean', {
    summary: '清理指定日期之前的日誌',
    middleware: ['authMiddleware'],
  })
  async cleanBefore(
    @Body() body: { date: string }
  ): Promise<{ deleted: number }> {
    const deleted = await this.operationLogService.cleanBefore(
      new Date(body.date)
    );
    await this.cacheService.delByPattern(`${OPERATION_LOG_CACHE_PREFIX}*`);
    return { deleted };
  }
}
