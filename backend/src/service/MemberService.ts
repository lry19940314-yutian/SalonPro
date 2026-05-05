// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員服務
// ============================================================================
// 功能：會員管理、等級計算、資產查詢、新客分析
// ============================================================================

import { Provide, Inject } from '@midwayjs/core';
import { MemberDAO } from '../dao/MemberDAO';
import { MemberLevelDAO } from '../dao/MemberLevelDAO';
import { MemberAssetDAO } from '../dao/MemberAssetDAO';
import { MemberAssetLogDAO } from '../dao/MemberAssetLogDAO';
import { Member } from '../entity/Member';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class MemberService {
  @Inject()
  memberDAO: MemberDAO;

  @Inject()
  memberLevelDAO: MemberLevelDAO;

  @Inject()
  memberAssetDAO: MemberAssetDAO;

  @Inject()
  memberAssetLogDAO: MemberAssetLogDAO;

  async findById(id: number): Promise<Member> {
    const member = await this.memberDAO.findById(id);
    if (!member) throw new NotFoundError('會員不存在');
    return member;
  }

  async findByShopId(shopId: number, page = 1, pageSize = 20): Promise<{ items: Member[]; total: number }> {
    const [items, total] = await this.memberDAO.findByShopId(shopId, page, pageSize);
    return { items, total };
  }

  async search(params: {
    shopId: number;
    keyword?: string;
    levelId?: number;
    gender?: number;
    status?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Member[]; total: number }> {
    const [items, total] = await this.memberDAO.search(params);
    return { items, total };
  }

  async create(data: {
    shopId: number;
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
  }): Promise<Member> {
    const existing = await this.memberDAO.findByPhone(data.phone);
    if (existing) {
      throw new BusinessError('該手機號已註冊為會員');
    }

    const memberNo = await this.generateMemberNo(data.shopId);

    return this.memberDAO.create({
      shopId: data.shopId,
      memberNo,
      name: data.name,
      phone: data.phone,
      birthday: data.birthday,
      gender: data.gender,
      levelId: data.levelId,
      skinType: data.skinType,
      allergyInfo: data.allergyInfo,
      preferences: data.preferences,
      tags: data.tags,
      remark: data.remark,
      status: 1,
    });
  }

  async update(id: number, data: Partial<Member>): Promise<Member> {
    await this.findById(id);
    if (data.phone) {
      const existing = await this.memberDAO.findByPhone(data.phone);
      if (existing && existing.id !== id) {
        throw new BusinessError('該手機號已被其他會員使用');
      }
    }
    const updated = await this.memberDAO.update(id, data);
    if (!updated) throw new BusinessError('更新會員失敗');
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.memberDAO.delete(id);
  }

  async getAssetSummary(memberId: number) {
    return this.memberAssetDAO.getAssetSummary(memberId);
  }

  async getMemberLevels(shopId: number): Promise<import('../entity/MemberLevel').MemberLevel[]> {
    return this.memberLevelDAO.findByShopId(shopId);
  }

  /**
   * 生成會員編號
   */
  private async generateMemberNo(shopId: number): Promise<string> {
    const count = await this.memberDAO.countByShopId(shopId);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `M${dateStr}${String(shopId).padStart(3, '0')}${String(count + 1).padStart(4, '0')}`;
  }

  // ==================== 新客分析 ====================

  /**
   * 獲取新客分析 - 新客總覽數據
   *
   * 返回數據包含：
   * - metrics: 新客核心指標（累計總數、本月/本周/今日新增、環比增長率）
   * - trend: 最近30天新客增長趨勢
   * - sources: 新客來源統計
   *
   * @param shopId - 門店 ID
   * @returns 新客總覽分析數據
   */
  async getNewCustomerAnalysis(shopId: number): Promise<{
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
    const now = new Date();

    // 計算本月起始
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 計算本周起始（週一）
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // 計算今日起始
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 計算上個月起始（用於環比）
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 最近30天起始
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // 並行查詢所有數據
    const [
      totalNewCustomer,
      monthNewCustomer,
      weekNewCustomer,
      dayNewCustomer,
      lastMonthNewCustomer,
      trendRaw,
      sourceStats,
    ] = await Promise.all([
      this.memberDAO.countByShopId(shopId),
      this.memberDAO.countNewMembers(shopId, monthStart, now),
      this.memberDAO.countNewMembers(shopId, weekStart, now),
      this.memberDAO.countNewMembers(shopId, dayStart, now),
      this.memberDAO.countNewMembers(shopId, lastMonthStart, lastMonthEnd),
      this.memberDAO.getNewCustomerTrend(shopId, thirtyDaysAgo, now),
      this.memberDAO.getNewCustomerSourceStats(shopId),
    ]);

    // 計算環比增長率
    const monthGrowthRate = lastMonthNewCustomer > 0
      ? ((monthNewCustomer - lastMonthNewCustomer) / lastMonthNewCustomer) * 100
      : monthNewCustomer > 0 ? 100 : 0;

    // 格式化趨勢數據
    const trend = trendRaw.map((item) => ({
      date: item.date,
      newCustomerCount: item.count,
    }));

    // 計算來源總數
    const totalSourceCount = sourceStats.reduce((sum, item) => sum + item.count, 0);

    // 格式化來源統計
    const sources = sourceStats.map((item) => ({
      sourceName: item.source || '其他',
      sourceCount: item.count,
      sourceRatio: totalSourceCount > 0 ? parseFloat(((item.count / totalSourceCount) * 100).toFixed(1)) : 0,
    }));

    return {
      metrics: {
        totalNewCustomer,
        monthNewCustomer,
        weekNewCustomer,
        dayNewCustomer,
        monthGrowthRate: parseFloat(monthGrowthRate.toFixed(1)),
      },
      trend,
      sources,
    };
  }

  // ==================== 回流分析 ====================

  /**
   * 獲取工作人員未回流客統計
   *
   * GET /admin/member/backflow/staff-stat
   *
   * 統計每位工作人員負責的會員中，超過 30 天未到店的會員數與佔比
   *
   * @param shopId - 門店 ID
   * @returns 工作人員未回流客統計列表
   */
  async getStaffNonReturnStats(shopId: number): Promise<
    Array<{
      staffId: number;
      staffName: string;
      noBackflowCount: number;
      noBackflowRatio: number;
    }>
  > {
    const stats = await this.memberDAO.getStaffNonReturnStats(shopId, 30);

    return stats.map((item) => ({
      staffId: item.staffId,
      staffName: item.staffName,
      noBackflowCount: item.noBackflowCount,
      noBackflowRatio:
        item.totalCount > 0
          ? parseFloat(((item.noBackflowCount / item.totalCount) * 100).toFixed(1))
          : 0,
    }));
  }

  /**
   * 獲取回流客列表
   *
   * GET /admin/member/backflow/list
   *
   * 查詢最近 30 天內有到店記錄的會員列表
   *
   * @param shopId - 門店 ID
   * @param page - 當前頁碼
   * @param pageSize - 每頁筆數
   * @returns 回流客列表（分頁）
   */
  async getBackflowMemberList(
    shopId: number,
    page: number = 1,
    pageSize: number = 10
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
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 30);

    const [items, total] = await this.memberDAO.getBackflowMemberList(
      shopId,
      startDate,
      now,
      page,
      pageSize
    );

    return { items, total, page, pageSize };
  }

  /**
   * 獲取未回流客列表
   *
   * GET /admin/member/backflow/no-list
   *
   * 查詢超過 30 天未到店的會員列表
   *
   * @param shopId - 門店 ID
   * @param page - 當前頁碼
   * @param pageSize - 每頁筆數
   * @returns 未回流客列表（分頁）
   */
  async getNonReturnMemberList(
    shopId: number,
    page: number = 1,
    pageSize: number = 10
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
    const [items, total] = await this.memberDAO.getNonReturnMemberList(
      shopId,
      30,
      page,
      pageSize
    );

    return { items, total, page, pageSize };
  }

  /**
   * 獲取回流/未回流核心指標
   *
   * @param shopId - 門店 ID
   * @returns 回流客總數、未回流客總數、回流佔比
   */
  async getBackflowMetrics(shopId: number): Promise<{
    totalReturnCount: number;
    totalNonReturnCount: number;
    returnRatio: number;
  }> {
    const { totalReturnCount, totalNonReturnCount } =
      await this.memberDAO.getBackflowMetrics(shopId, 30);

    const total = totalReturnCount + totalNonReturnCount;
    const returnRatio =
      total > 0
        ? parseFloat(((totalReturnCount / total) * 100).toFixed(1))
        : 0;

    return { totalReturnCount, totalNonReturnCount, returnRatio };
  }
}
