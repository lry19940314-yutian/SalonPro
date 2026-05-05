// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員分析控制器
// ============================================================================
// 功能：會員分析相關接口
//   - GET /admin/member/analysis/new-customer  新客總覽分析
// 數據庫表結構參考：database/README.md
//   - member 表：會員資料，關聯 member.created_at、member.source
// ============================================================================

import {
  Controller,
  Get,
  Inject,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { MemberService } from '../service/MemberService';

@Controller('/admin/member/analysis', {
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
  @Get('/new-customer', { summary: '新客總覽分析' })
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
}
