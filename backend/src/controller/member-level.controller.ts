// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員等級控制器
// ============================================================================
// 功能：會員等級的 CRUD 接口
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
import { MemberLevelService } from '../service/MemberLevelService';
import { MemberLevel } from '../entity/MemberLevel';
import { CacheService } from '../redis/cache.service';
import { CacheGuardService } from '../redis/guard.service';
import { MemberCacheKey } from '../redis/types';

@Controller('/member-levels', {
  tagName: '會員等級',
  description: '會員等級的 CRUD 接口',
})
export class MemberLevelController {
  @Inject()
  memberLevelService: MemberLevelService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢會員等級（含緩存）
   *
   * GET /api/member-levels/:id
   */
  @Get('/:id', { summary: '查詢會員等級' })
  async findById(@Param('id') id: number): Promise<MemberLevel> {
    const cacheKey = `${MemberCacheKey.LEVEL}${id}`;
    const result = await this.cacheGuardService.safeQuery<MemberLevel>(
      cacheKey,
      MemberCacheKey.LEVEL,
      id,
      () => this.memberLevelService.findById(id),
      600
    );
    if (!result) throw new Error('會員等級不存在');
    return result;
  }

  /**
   * 查詢當前門店的所有會員等級
   *
   * GET /api/member-levels
   */
  @Get('/', { summary: '查詢會員等級列表' })
  async findByShopId(): Promise<MemberLevel[]> {
    const shopId: number = this.ctx.state.shopId;
    return this.memberLevelService.findByShopId(shopId);
  }

  /**
   * 創建會員等級
   *
   * POST /api/member-levels
   */
  @Post('/', { summary: '創建會員等級', middleware: ['authMiddleware'] })
  async create(
    @Body()
    body: {
      name: string;
      level: number;
      minConsumption: number;
      discountRate?: number;
      color?: string;
      benefits?: string[];
    }
  ): Promise<MemberLevel> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.memberLevelService.create({ shopId, ...body });
    await this.cacheService.delByPattern(`${MemberCacheKey.LEVEL}*`);
    return result;
  }

  /**
   * 更新會員等級
   *
   * PUT /api/member-levels/:id
   */
  @Put('/:id', { summary: '更新會員等級', middleware: ['authMiddleware'] })
  async update(
    @Param('id') id: number,
    @Body() body: Partial<MemberLevel>
  ): Promise<MemberLevel> {
    const result = await this.memberLevelService.update(id, body);
    await this.cacheService.delByPattern(`${MemberCacheKey.LEVEL}*`);
    return result;
  }

  /**
   * 刪除會員等級
   *
   * DELETE /api/member-levels/:id
   */
  @Del('/:id', { summary: '刪除會員等級', middleware: ['authMiddleware'] })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.memberLevelService.delete(id);
    await this.cacheService.delByPattern(`${MemberCacheKey.LEVEL}*`);
    return { message: '刪除成功' };
  }
}
