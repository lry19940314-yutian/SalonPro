// ============================================================================
// 美業 SaaS 智慧管理系統 — 系統配置控制器
// ============================================================================
// 功能：系統配置管理接口（集成 Redis 緩存）
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { SystemConfigService } from '../service/SystemConfigService';
import { SystemConfig } from '../entity/SystemConfig';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';
import { ConfigCacheKey } from '../redis/types';

const SYSTEM_CONFIG_CACHE_PREFIX = 'sys_cfg:';

@Controller('/api/system-configs', {
  tagName: '系統配置',
  description: '系統配置管理接口',
})
export class SystemConfigController {
  @Inject()
  systemConfigService: SystemConfigService;

  @Inject()
  ctx: Context;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  /**
   * 根據 ID 查詢配置
   *
   * GET /api/system-configs/:id
   */
  @Get('/:id', { summary: '查詢系統配置' })
  async findById(@Param('id') id: number): Promise<SystemConfig> {
    const cacheKey = `${SYSTEM_CONFIG_CACHE_PREFIX}${id}`;
    const result = await this.cacheGuardService.safeQuery<SystemConfig>(
      cacheKey, ConfigCacheKey.SYSTEM, id,
      () => this.systemConfigService.findById(id), 600
    );
    if (!result) throw new Error('系統配置不存在');
    return result;
  }

  /**
   * 根據配置鍵查詢
   *
   * GET /api/system-configs/key/:configKey
   */
  @Get('/key/:configKey', { summary: '根據配置鍵查詢' })
  async findByKey(
    @Param('configKey') configKey: string
  ): Promise<SystemConfig | null> {
    return this.systemConfigService.findByKey(configKey);
  }

  /**
   * 根據鍵前綴查詢
   *
   * GET /api/system-configs/prefix/:prefix
   */
  @Get('/prefix/:prefix', { summary: '根據鍵前綴查詢' })
  async findByKeyPrefix(
    @Param('prefix') prefix: string
  ): Promise<SystemConfig[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.systemConfigService.findByKeyPrefix(shopId, prefix);
  }

  /**
   * 獲取配置映射
   *
   * GET /api/system-configs/map
   */
  @Get('/map', { summary: '獲取配置映射' })
  async getConfigMap(): Promise<Record<string, string>> {
    const shopId: number = this.ctx.state.shopId;
    return this.systemConfigService.getConfigMap(shopId);
  }

  /**
   * 創建或更新配置
   *
   * POST /api/system-configs
   */
  @Post('/', { summary: '創建或更新配置', middleware: ['authMiddleware'] })
  async upsert(
    @Body()
    body: {
      configKey: string;
      configValue: string;
      description?: string;
    }
  ): Promise<SystemConfig> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.systemConfigService.upsert({ shopId, ...body });
    await this.cacheService.delByPattern(`${SYSTEM_CONFIG_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 更新配置值
   *
   * PUT /api/system-configs/:configKey/value
   */
  @Put('/:configKey/value', {
    summary: '更新配置值',
    middleware: ['authMiddleware'],
  })
  async updateValue(
    @Param('configKey') configKey: string,
    @Body() body: { configValue: string }
  ): Promise<{ message: string }> {
    await this.systemConfigService.updateValue(configKey, body.configValue);
    await this.cacheService.delByPattern(`${SYSTEM_CONFIG_CACHE_PREFIX}*`);
    return { message: '更新成功' };
  }

  /**
   * 批量設置配置
   *
   * POST /api/system-configs/batch
   */
  @Post('/batch', {
    summary: '批量設置配置',
    middleware: ['authMiddleware'],
  })
  async setConfigs(
    @Body() body: { configs: Record<string, string> }
  ): Promise<{ message: string }> {
    const shopId: number = this.ctx.state.shopId;
    await this.systemConfigService.setConfigs(shopId, body.configs);
    await this.cacheService.delByPattern(`${SYSTEM_CONFIG_CACHE_PREFIX}*`);
    return { message: '設置成功' };
  }
}
