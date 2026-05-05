// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員分析控制器
// ============================================================================
// 功能：會員分析相關接口
//   - GET /admin/member/analysis/new-customer  新客總覽分析
//   - GET /admin/member/backflow/staff-stat    工作人員未回流客統計
//   - GET /admin/member/backflow/list          回流客列表
//   - GET /admin/member/backflow/no-list       未回流客列表
// 數據庫表結構參考：database/README.md
//   - member 表：會員資料，關聯 member.created_at、member.source
//   - appointment 表：預約訂單，關聯 member.last_visit
//   - staff 表：員工資料
// ============================================================================

import {
  Controller,
  Get,
  Query,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { MemberService } from '../service/MemberService';

@Controller('/admin/member', {
  tagName: '會員分析',
  description: '會員分析數據接口',
})
export class MemberAnalysisController {
  @Inject()
  memberService: MemberService;

  @Inject()
  ctx: Context;

  /**
   * 獲取新客分析 - 新客總覽數據
   *
   * GET /api/admin/member/analysis/new-customer
   *
   * 返回數據：
   * - metrics: 新客核心指標（累計總數、本月/本周/今日新增、環比增長率）
   * - trend: 最近30天新客增長趨勢
   * - sources: 新客來源統計
   *
   * 數據庫來源：
   * - member 表：關聯 member.created_at（新客時間）、member.source（來源渠道）
   * - 核心指標：按 shop_id 聚合，統計總數、本月、本周、今日新增
   * - 增長趨勢：按日期聚合最近30天新增會員數
   * - 來源統計：按 source 字段分組統計
   */
  @Get('/analysis/new-customer', { summary: '新客總覽分析' })
  async getNewCustomerAnalysis(): Promise<{
    metrics: {
      totalNewCustomer: number;
      monthNewCustomer: number;
      weekNewCustomer: number;
      dayNewCustomer: number;
      monthGrowthRate: number;
    };
    trend: Array<{ date: string; newCustomerCount: number }>;
    sources: Array<{ sourceName: string; sourceCount: number; sourceRatio: number }>;
  }> {
    const shopId: number = this.ctx.state.shopId;
    return this.memberService.getNewCustomerAnalysis(shopId);
  }

  // ==================== 回流分析接口 ====================

  /**
   * 獲取工作人員未回流客統計
   *
   * GET /api/admin/member/backflow/staff-stat
   *
   * 統計每位工作人員負責的會員中，超過 30 天未到店的會員數與佔比
   *
   * 數據庫來源：
   * - member 表：關聯 member.staff_id（負責人員）、member.last_visit（最後到店時間）
   * - staff 表：員工姓名 name
   *
   * @returns 工作人員未回流客統計列表
   */
  @Get('/backflow/staff-stat', { summary: '工作人員未回流客統計' })
  async getStaffNonReturnStats(): Promise<
    Array<{
      staffId: number;
      staffName: string;
      noBackflowCount: number;
      noBackflowRatio: number;
    }>
  > {
    const shopId: number = this.ctx.state.shopId;
    return this.memberService.getStaffNonReturnStats(shopId);
  }

  /**
   * 獲取回流客列表
   *
   * GET /api/admin/member/backflow/list?page=1&pageSize=10
   *
   * 查詢最近 30 天內有到店記錄的會員列表
   *
   * 數據庫來源：
   * - member 表：關聯 member.last_visit（最後到店時間）
   * - member_level 表：會員等級名稱
   * - staff 表：負責人員姓名
   *
   * @param page - 當前頁碼（預設 1）
   * @param pageSize - 每頁筆數（預設 10）
   * @returns 回流客分頁列表
   */
  @Get('/backflow/list', { summary: '回流客列表' })
  async getBackflowMemberList(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{
    items: Array<{
      memberId: string;
      memberName: string;
      memberPhone: string;
      memberLevel: string;
      lastConsumeTime: string;
      chargeStaffName: string;
      backflowStatus: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const shopId: number = this.ctx.state.shopId;
    const currentPage = page || 1;
    const currentPageSize = pageSize || 10;
    return this.memberService.getBackflowMemberList(shopId, currentPage, currentPageSize);
  }

  /**
   * 獲取未回流客列表
   *
   * GET /api/admin/member/backflow/no-list?page=1&pageSize=10
   *
   * 查詢超過 30 天未到店的會員列表
   *
   * 數據庫來源：
   * - member 表：關聯 member.last_visit（最後到店時間）
   * - member_level 表：會員等級名稱
   * - staff 表：負責人員姓名
   *
   * @param page - 當前頁碼（預設 1）
   * @param pageSize - 每頁筆數（預設 10）
   * @returns 未回流客分頁列表
   */
  @Get('/backflow/no-list', { summary: '未回流客列表' })
  async getNonReturnMemberList(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ): Promise<{
    items: Array<{
      memberId: string;
      memberName: string;
      memberPhone: string;
      memberLevel: string;
      lastConsumeTime: string;
      chargeStaffName: string;
      noBackflowDays: number;
      lossLevel: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const shopId: number = this.ctx.state.shopId;
    const currentPage = page || 1;
    const currentPageSize = pageSize || 10;
    return this.memberService.getNonReturnMemberList(shopId, currentPage, currentPageSize);
  }
}
