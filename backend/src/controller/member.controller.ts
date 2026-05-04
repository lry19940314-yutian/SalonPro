// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員控制器
// ============================================================================
// 功能：會員的 CRUD、搜索、資產查詢接口
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Del,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { MemberService } from '../service/MemberService';
import { Member } from '../entity/Member';
import { CacheService } from '../redis/cache.service';
import { LockService } from '../redis/lock.service';
import { CacheGuardService } from '../redis/guard.service';
import { CacheKeyPrefix, MemberCacheKey, LockKey } from '../redis/types';

@Controller('/api/members', {
  tagName: '會員',
  description: '會員的 CRUD 接口',
})
export class MemberController {
  @Inject()
  memberService: MemberService;

  @Inject()
  cacheService: CacheService;

  @Inject()
  lockService: LockService;

  @Inject()
  cacheGuardService: CacheGuardService;

  @Inject()
  ctx: Context;

  /**
   * 根據 ID 查詢會員（含緩存）
   *
   * GET /api/members/:id
   */
  @Get('/:id', { summary: '查詢會員' })
  async findById(@Param('id') id: number): Promise<Member> {
    const cacheKey = `${MemberCacheKey.PROFILE}${id}`;
    const result = await this.cacheGuardService.safeQuery<Member>(
      cacheKey,
      MemberCacheKey.PROFILE,
      id,
      () => this.memberService.findById(id),
      600
    );
    if (!result) throw new Error('會員不存在');
    return result;
  }

  /**
   * 查詢當前門店的會員列表（分頁）
   *
   * GET /api/members?page=1&pageSize=20
   */
  @Get('/', { summary: '查詢會員列表' })
  async findByShopId(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Member[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.memberService.findByShopId(shopId, page, pageSize);
  }

  /**
   * 搜索會員
   *
   * GET /api/members/search?keyword=xxx&levelId=1&gender=1&status=1
   */
  @Get('/search', { summary: '搜索會員' })
  async search(
    @Query('keyword') keyword?: string,
    @Query('levelId') levelId?: number,
    @Query('gender') gender?: number,
    @Query('status') status?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{ items: Member[]; total: number }> {
    const shopId: number = this.ctx.state.shopId;
    return this.memberService.search({
      shopId,
      keyword,
      levelId,
      gender,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      pageSize,
    });
  }

  /**
   * 獲取會員資產摘要（含緩存）
   *
   * GET /api/members/:id/assets
   */
  @Get('/:id/assets', { summary: '獲取會員資產摘要' })
  async getAssetSummary(@Param('id') id: number) {
    const cacheKey = `${MemberCacheKey.ASSET}${id}`;
    const result = await this.cacheGuardService.safeQuery(
      cacheKey,
      MemberCacheKey.ASSET,
      id,
      () => this.memberService.getAssetSummary(id),
      300
    );
    if (!result) return { balance: 0, totalPoints: 0, courses: [] };
    return result;
  }

  /**
   * 創建會員
   *
   * POST /api/members
   */
  @Post('/', { summary: '創建會員', middleware: ['authMiddleware'] })
  async create(
    @Body()
    body: {
      name: string;
      phone: string;
      birthday?: string;
      gender?: number;
      levelId?: number;
      skinType?: string;
      allergyInfo?: string;
      preferences?: Record<string, unknown>;
      tags?: string[];
      remark?: string;
    }
  ): Promise<Member> {
    const shopId: number = this.ctx.state.shopId;
    const result = await this.memberService.create({ shopId, ...body });
    await this.cacheService.delByPattern(`${MemberCacheKey.PROFILE}*`);
    return result;
  }

  /**
   * 更新會員
   *
   * PUT /api/members/:id
   */
  @Put('/:id', { summary: '更新會員', middleware: ['authMiddleware'] })
  async update(
    @Param('id') id: number,
    @Body() body: Partial<Member>
  ): Promise<Member> {
    const result = await this.memberService.update(id, body);
    // 清除該會員的相關緩存
    await this.cacheService.del(`${MemberCacheKey.PROFILE}${id}`);
    await this.cacheService.del(`${MemberCacheKey.ASSET}${id}`);
    return result;
  }

  /**
   * 刪除會員
   *
   * DELETE /api/members/:id
   */
  @Del('/:id', { summary: '刪除會員', middleware: ['authMiddleware'] })
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.memberService.delete(id);
    await this.cacheService.del(`${MemberCacheKey.PROFILE}${id}`);
    await this.cacheService.del(`${MemberCacheKey.ASSET}${id}`);
    return { message: '刪除成功' };
  }
}
