// ============================================================================
// 美業 SaaS 智慧管理系統 — 員工門店關聯控制器
// ============================================================================
// 功能：員工門店歸屬管理接口（集成 Redis 緩存）
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
import { StaffShopService } from '../service/StaffShopService';
import { StaffShop } from '../entity/StaffShop';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';

const STAFF_SHOP_CACHE_PREFIX = 'staff_shop:';

@Controller('/api/staff-shops', {
  tagName: '員工門店關聯',
  description: '員工門店歸屬管理接口',
})
export class StaffShopController {
  @Inject()
  staffShopService: StaffShopService;

  @Inject()
  ctx: Context;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  /**
   * 根據員工 ID 查詢關聯門店
   *
   * GET /api/staff-shops/by-staff/:staffId
   */
  @Get('/by-staff/:staffId', { summary: '查詢員工的關聯門店' })
  async findByStaffId(
    @Param('staffId') staffId: number
  ): Promise<StaffShop[]> {
    return this.staffShopService.findByStaffId(staffId);
  }

  /**
   * 根據門店 ID 查詢關聯員工
   *
   * GET /api/staff-shops/by-shop/:shopId
   */
  @Get('/by-shop/:shopId', { summary: '查詢門店的關聯員工' })
  async findByShopId(
    @Param('shopId') shopId: number
  ): Promise<StaffShop[]> {
    return this.staffShopService.findByShopId(shopId);
  }

  /**
   * 查詢員工的主門店
   *
   * GET /api/staff-shops/primary/:staffId
   */
  @Get('/primary/:staffId', { summary: '查詢員工的主門店' })
  async findPrimaryByStaffId(
    @Param('staffId') staffId: number
  ): Promise<StaffShop | null> {
    return this.staffShopService.findPrimaryByStaffId(staffId);
  }

  /**
   * 關聯員工到門店
   *
   * POST /api/staff-shops
   */
  @Post('/', {
    summary: '關聯員工到門店',
    middleware: ['authMiddleware'],
  })
  async assign(
    @Body()
    body: {
      staffId: number;
      shopId: number;
      isPrimary?: boolean;
    }
  ): Promise<StaffShop> {
    const result = await this.staffShopService.assign(body);
    await this.cacheService.delByPattern(`${STAFF_SHOP_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 更新關聯信息
   *
   * PUT /api/staff-shops/:id
   */
  @Put('/:id', {
    summary: '更新關聯信息',
    middleware: ['authMiddleware'],
  })
  async update(
    @Param('id') id: number,
    @Body() body: { isPrimary?: boolean }
  ): Promise<StaffShop> {
    const result = await this.staffShopService.update(id, body);
    await this.cacheService.delByPattern(`${STAFF_SHOP_CACHE_PREFIX}*`);
    return result;
  }

  /**
   * 解除員工門店關聯
   *
   * DELETE /api/staff-shops/:id
   */
  @Del('/:id', {
    summary: '解除員工門店關聯',
    middleware: ['authMiddleware'],
  })
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.staffShopService.remove(id);
    await this.cacheService.delByPattern(`${STAFF_SHOP_CACHE_PREFIX}*`);
    return { message: '解除成功' };
  }

  /**
   * 解除員工所有門店關聯
   *
   * DELETE /api/staff-shops/by-staff/:staffId
   */
  @Del('/by-staff/:staffId', {
    summary: '解除員工所有門店關聯',
    middleware: ['authMiddleware'],
  })
  async removeByStaffId(
    @Param('staffId') staffId: number
  ): Promise<{ message: string }> {
    await this.staffShopService.removeByStaffId(staffId);
    await this.cacheService.delByPattern(`${STAFF_SHOP_CACHE_PREFIX}*`);
    return { message: '解除成功' };
  }
}
