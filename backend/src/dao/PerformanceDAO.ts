// ============================================================================
// 美業 SaaS 智慧管理系統 — 業績記錄 DAO
// ============================================================================
// 功能：業績記錄表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, Between } from 'typeorm';
import { Performance } from '../entity/Performance';

@Provide()
export class PerformanceDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢業績記錄
   *
   * @param id - 業績記錄 ID
   * @returns 業績記錄實體或 null
   */
  async findById(id: number): Promise<Performance | null> {
    return this.entityManager.findOne(Performance, {
      where: { id },
    });
  }

  /**
   * 根據美容師 ID 查詢業績
   *
   * @param staffId - 美容師 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 業績記錄列表及總數
   */
  async findByStaffId(
    staffId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Performance[], number]> {
    return this.entityManager.findAndCount(Performance, {
      where: { staffId },
      order: { performanceDate: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據門店 ID 查詢業績
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 業績記錄列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Performance[], number]> {
    return this.entityManager.findAndCount(Performance, {
      where: { shopId },
      order: { performanceDate: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據預約 ID 查詢業績
   *
   * @param appointmentId - 預約 ID
   * @returns 業績記錄列表
   */
  async findByAppointmentId(appointmentId: number): Promise<Performance[]> {
    return this.entityManager.find(Performance, {
      where: { appointmentId },
    });
  }

  /**
   * 查詢指定日期範圍的業績
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 業績記錄列表
   */
  async findByDateRange(
    shopId: number,
    startDate: string,
    endDate: string
  ): Promise<Performance[]> {
    return this.entityManager.find(Performance, {
      where: {
        shopId,
        performanceDate: Between(startDate, endDate),
      },
      order: { performanceDate: 'DESC' },
    });
  }

  /**
   * 查詢指定美容師指定日期範圍的業績
   *
   * @param staffId - 美容師 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 業績記錄列表
   */
  async findByStaffIdAndDateRange(
    staffId: number,
    startDate: string,
    endDate: string
  ): Promise<Performance[]> {
    return this.entityManager.find(Performance, {
      where: {
        staffId,
        performanceDate: Between(startDate, endDate),
      },
      order: { performanceDate: 'DESC' },
    });
  }

  /**
   * 查詢未結算的業績
   *
   * @param shopId - 門店 ID
   * @returns 業績記錄列表
   */
  async findUnsettled(shopId: number): Promise<Performance[]> {
    return this.entityManager.find(Performance, {
      where: { shopId, settled: 0 },
      order: { performanceDate: 'ASC' },
    });
  }

  /**
   * 創建業績記錄
   *
   * @param performance - 業績記錄實體
   * @returns 創建後的業績記錄
   */
  async create(performance: Partial<Performance>): Promise<Performance> {
    const entity = this.entityManager.create(Performance, performance);
    return this.entityManager.save(entity);
  }

  /**
   * 批量創建業績記錄
   *
   * @param performances - 業績記錄實體列表
   * @returns 創建後的業績記錄列表
   */
  async createBatch(performances: Partial<Performance>[]): Promise<Performance[]> {
    const entities = this.entityManager.create(Performance, performances);
    return this.entityManager.save(entities);
  }

  /**
   * 標記業績為已結算
   *
   * @param ids - 業績記錄 ID 列表
   */
  async markAsSettled(ids: number[]): Promise<void> {
    await this.entityManager
      .createQueryBuilder()
      .update(Performance)
      .set({ settled: true })
      .where('id IN (:...ids)', { ids })
      .execute();
  }

  /**
   * 獲取美容師業績統計
   *
   * @param staffId - 美容師 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 統計信息
   */
  async getStaffPerformanceStats(
    staffId: number,
    startDate: string,
    endDate: string
  ): Promise<{
    totalAmount: number;
    totalCommission: number;
    serviceCount: number;
    productCount: number;
  }> {
    const result = await this.entityManager
      .createQueryBuilder(Performance, 'performance')
      .select([
        'COALESCE(SUM(performance.amount), 0) AS totalAmount',
        'COALESCE(SUM(performance.commissionAmount), 0) AS totalCommission',
        "SUM(CASE WHEN performance.type = 'service' THEN 1 ELSE 0 END) AS serviceCount",
        "SUM(CASE WHEN performance.type = 'product' THEN 1 ELSE 0 END) AS productCount",
      ])
      .where('performance.staffId = :staffId', { staffId })
      .andWhere('performance.performanceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return {
      totalAmount: Number(result?.totalAmount || 0),
      totalCommission: Number(result?.totalCommission || 0),
      serviceCount: Number(result?.serviceCount || 0),
      productCount: Number(result?.productCount || 0),
    };
  }

  /**
   * 獲取門店業績統計
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 統計信息
   */
  async getShopPerformanceStats(
    shopId: number,
    startDate: string,
    endDate: string
  ): Promise<{
    totalAmount: number;
    totalCommission: number;
    totalCount: number;
  }> {
    const result = await this.entityManager
      .createQueryBuilder(Performance, 'performance')
      .select([
        'COALESCE(SUM(performance.amount), 0) AS totalAmount',
        'COALESCE(SUM(performance.commissionAmount), 0) AS totalCommission',
        'COUNT(*) AS totalCount',
      ])
      .where('performance.shopId = :shopId', { shopId })
      .andWhere('performance.performanceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return {
      totalAmount: Number(result?.totalAmount || 0),
      totalCommission: Number(result?.totalCommission || 0),
      totalCount: Number(result?.totalCount || 0),
    };
  }

  /**
   * 獲取工作人員業績排行
   *
   * 按 staff_id 分組，SUM(amount) 計算總業績，JOIN staff 表取得姓名
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @param limit - 排行數量（預設 10）
   * @returns 工作人員業績排行列表
   */
  async getStaffRanking(
    shopId: number,
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<Array<{
    staffId: number;
    name: string;
    amount: number;
    percentage: number;
  }>> {
    // 1. 查詢該門店在日期範圍內的總業績（用於計算百分比）
    const totalResult = await this.entityManager
      .createQueryBuilder(Performance, 'performance')
      .select('COALESCE(SUM(performance.amount), 0)', 'totalAmount')
      .where('performance.shopId = :shopId', { shopId })
      .andWhere('performance.performanceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    const totalAmount = Number(totalResult?.totalAmount || 0);

    // 2. 按 staff_id 分組統計業績，JOIN staff 表取得姓名
    const rawResults = await this.entityManager
      .createQueryBuilder(Performance, 'performance')
      .select([
        'performance.staffId AS staffId',
        'COALESCE(SUM(performance.amount), 0) AS amount',
      ])
      .where('performance.shopId = :shopId', { shopId })
      .andWhere('performance.performanceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('performance.staffId')
      .orderBy('amount', 'DESC')
      .limit(limit)
      .getRawMany();

    if (rawResults.length === 0) {
      return [];
    }

    // 3. 查詢員工姓名
    const staffIds = rawResults.map((r: any) => Number(r.staffId));
    const staffList = await this.entityManager
      .createQueryBuilder()
      .select(['id', 'name'])
      .from('staff', 's')
      .where('s.id IN (:...ids)', { ids: staffIds })
      .getRawMany();

    const staffNameMap = new Map<number, string>();
    staffList.forEach((s: any) => {
      staffNameMap.set(Number(s.id), s.name);
    });

    // 4. 計算最大業績金額（用於百分比）
    const maxAmount = Math.max(...rawResults.map((r: any) => Number(r.amount)), 1);

    // 5. 組裝返回數據（含排名）
    return rawResults.map((r: any, index: number) => {
      const staffId = Number(r.staffId);
      const amount = Number(r.amount);
      return {
        staffId,
        name: staffNameMap.get(staffId) || `員工#${staffId}`,
        amount,
        percentage: Math.round((amount / maxAmount) * 100),
      };
    });
  }

  /**
   * 獲取門店分類營業額統計（按 service_category 分組）
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 分類營業額列表（含分類名稱、營業額、佔比）
   */
  async getCategoryRevenueStats(
    shopId: number,
    startDate: string,
    endDate: string
  ): Promise<Array<{
    categoryId: number;
    categoryName: string;
    amount: number;
    ratio: number;
  }>> {
    // 1. 先查詢該門店在日期範圍內的總營業額
    const totalResult = await this.entityManager
      .createQueryBuilder(Performance, 'performance')
      .select('COALESCE(SUM(performance.amount), 0)', 'totalAmount')
      .where('performance.shopId = :shopId', { shopId })
      .andWhere('performance.performanceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    const totalAmount = Number(totalResult?.totalAmount || 0);

    if (totalAmount === 0) {
      return [];
    }

    // 2. 按 category_id 分組統計營業額
    const rawResults = await this.entityManager
      .createQueryBuilder(Performance, 'performance')
      .select([
        'performance.categoryId AS categoryId',
        'COALESCE(SUM(performance.amount), 0) AS amount',
      ])
      .where('performance.shopId = :shopId', { shopId })
      .andWhere('performance.performanceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('performance.categoryId IS NOT NULL')
      .groupBy('performance.categoryId')
      .orderBy('amount', 'DESC')
      .getRawMany();

    if (rawResults.length === 0) {
      return [];
    }

    // 3. 查詢分類名稱（從 service_category 表）
    const categoryIds = rawResults.map((r: any) => Number(r.categoryId));
    const categories = await this.entityManager
      .createQueryBuilder()
      .select(['id', 'name'])
      .from('service_category', 'sc')
      .where('sc.id IN (:...ids)', { ids: categoryIds })
      .getRawMany();

    const categoryMap = new Map<number, string>();
    categories.forEach((c: any) => {
      categoryMap.set(Number(c.id), c.name);
    });

    // 4. 組裝返回數據
    return rawResults.map((r: any) => {
      const catId = Number(r.categoryId);
      const amount = Number(r.amount);
      return {
        categoryId: catId,
        categoryName: categoryMap.get(catId) || `分類#${catId}`,
        amount,
        ratio: Math.round((amount / totalAmount) * 1000) / 10, // 保留一位小數
      };
    });
  }

  /**
   * 獲取門店年度營業額統計（含月度明細與同比增幅）
   *
   * 查詢邏輯：
   * 1. 按月份 GROUP BY performanceDate，SUM(amount) 計算各月營業額
   * 2. 計算去年同期的總營業額（用於同比增幅）
   *
   * @param shopId - 門店 ID
   * @param year - 年份
   * @returns 年度營業額統計
   */
  async getYearlyRevenueStats(
    shopId: number,
    year: number
  ): Promise<{
    year: number;
    totalAmount: number;
    monthlyData: number[];
    growthRate: number;
  }> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const lastYear = year - 1;
    const lastYearStart = `${lastYear}-01-01`;
    const lastYearEnd = `${lastYear}-12-31`;

    // 1. 查詢今年各月營業額
    const monthlyResults = await this.entityManager
      .createQueryBuilder(Performance, 'performance')
      .select([
        'MONTH(performance.performanceDate) AS month',
        'COALESCE(SUM(performance.amount), 0) AS amount',
      ])
      .where('performance.shopId = :shopId', { shopId })
      .andWhere('performance.performanceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('MONTH(performance.performanceDate)')
      .orderBy('month', 'ASC')
      .getRawMany();

    // 2. 初始化月度陣列（1-12月，預設 0）
    const monthlyData: number[] = new Array(12).fill(0);
    let totalAmount = 0;

    monthlyResults.forEach((r: any) => {
      const monthIndex = Number(r.month) - 1;
      const amount = Number(r.amount);
      monthlyData[monthIndex] = amount;
      totalAmount += amount;
    });

    // 3. 查詢去年總營業額（用於同比增幅）
    const lastYearResult = await this.entityManager
      .createQueryBuilder(Performance, 'performance')
      .select('COALESCE(SUM(performance.amount), 0)', 'totalAmount')
      .where('performance.shopId = :shopId', { shopId })
      .andWhere('performance.performanceDate BETWEEN :startDate AND :endDate', {
        startDate: lastYearStart,
        endDate: lastYearEnd,
      })
      .getRawOne();

    const lastYearTotal = Number(lastYearResult?.totalAmount || 0);

    // 4. 計算同比增幅
    let growthRate = 0;
    if (lastYearTotal > 0) {
      growthRate = Math.round(((totalAmount - lastYearTotal) / lastYearTotal) * 1000) / 10;
    }

    return {
      year,
      totalAmount,
      monthlyData,
      growthRate,
    };
  }
}
