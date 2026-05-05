// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員數據訪問層
// ============================================================================
// 功能：會員 CRUD、查詢、統計
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, Between, Like } from 'typeorm';
import { Member } from '../entity/Member';

@Provide()
export class MemberDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢會員
   */
  async findById(id: number): Promise<Member | null> {
    return this.entityManager.findOne(Member, { where: { id } });
  }

  /**
   * 根據門店 ID 查詢會員列表（分頁）
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Member[], number]> {
    return this.entityManager.findAndCount(Member, {
      where: { shopId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根據手機號查詢會員
   */
  async findByPhone(phone: string): Promise<Member | null> {
    return this.entityManager.findOne(Member, { where: { phone } });
  }

  /**
   * 根據會員編號查詢會員
   */
  async findByMemberNo(memberNo: string): Promise<Member | null> {
    return this.entityManager.findOne(Member, { where: { memberNo } });
  }

  /**
   * 根據 ID 列表批量查詢會員
   */
  async findByIds(ids: number[]): Promise<Member[]> {
    return this.entityManager.findByIds(Member, ids);
  }

  /**
   * 搜尋會員（支援關鍵字、等級、性別、狀態、日期範圍）
   */
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
  }): Promise<[Member[], number]> {
    const { shopId, keyword, levelId, gender, status, startDate, endDate, page = 1, pageSize = 20 } = params;

    const where: any = { shopId };

    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }
    if (levelId !== undefined) {
      where.levelId = levelId;
    }
    if (gender !== undefined) {
      where.gender = gender;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    return this.entityManager.findAndCount(Member, {
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 新增會員
   */
  async create(member: Partial<Member>): Promise<Member> {
    const result = this.entityManager.create(Member, member);
    return this.entityManager.save(result);
  }

  /**
   * 更新會員
   */
  async update(id: number, data: Partial<Member>): Promise<Member | null> {
    await this.entityManager.update(Member, id, data as any);
    return this.findById(id);
  }

  /**
   * 刪除會員
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(Member, id);
  }

  /**
   * 更新會員消費資訊（累計金額 + 到店次數 + 最後到店時間）
   */
  async updateConsumption(id: number, amount: number): Promise<void> {
    await this.entityManager
      .createQueryBuilder()
      .update(Member)
      .set({
        totalConsumption: () => 'totalConsumption + :amount',
        visitCount: () => 'visitCount + 1',
        lastVisit: () => 'NOW()',
      })
      .where('id = :id', { id })
      .setParameter('amount', amount)
      .execute();
  }

  /**
   * 統計門店會員總數
   */
  async countByShopId(shopId: number): Promise<number> {
    return this.entityManager
      .createQueryBuilder(Member, 'member')
      .where('member.shop_id = :shopId', { shopId })
      .getCount();
  }

  /**
   * 統計指定時間範圍內新增會員數（新客人數）
   */
  async countNewMembers(shopId: number, startDate: Date, endDate: Date): Promise<number> {
    return this.entityManager
      .createQueryBuilder(Member, 'member')
      .where('member.shop_id = :shopId', { shopId })
      .andWhere('member.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getCount();
  }

  /**
   * 獲取指定時間範圍內每日新增會員數（新客增長趨勢）
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 每日新增會員數列表
   */
  async getNewCustomerTrend(
    shopId: number,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; count: number }>> {
    const rawData: Array<{ createdAt: Date }> = await this.entityManager
      .createQueryBuilder(Member, 'member')
      .select('DATE(member.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('member.shop_id = :shopId', { shopId })
      .andWhere('member.created_at >= :startDate', { startDate })
      .andWhere('member.created_at <= :endDate', { endDate })
      .groupBy('DATE(member.created_at)')
      .orderBy('DATE(member.created_at)', 'ASC')
      .getRawMany();

    return rawData.map((item: any) => ({
      date: item.date,
      count: parseInt(item.count, 10),
    }));
  }

  /**
   * 獲取新客來源統計（按 source 字段分組）
   *
   * @param shopId - 門店 ID
   * @returns 各來源渠道的新客數量列表
   */
  async getNewCustomerSourceStats(shopId: number): Promise<Array<{ source: string; count: number }>> {
    const rawData: Array<{ source: string; count: number }> = await this.entityManager
      .createQueryBuilder(Member, 'member')
      .select('member.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .where('member.shop_id = :shopId', { shopId })
      .andWhere('member.source IS NOT NULL')
      .andWhere("member.source != ''")
      .groupBy('member.source')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    return rawData.map((item: any) => ({
      source: item.source,
      count: parseInt(item.count, 10),
    }));
  }

  // ==================== 回流分析 ====================

  /**
   * 獲取工作人員未回流客統計
   * 統計每位工作人員負責的會員中，超過指定天數未到店的會員數與佔比
   *
   * 注意：member 表沒有 staff_id 欄位，需透過 appointment 表關聯
   * 每位會員取最後一次預約的美容師作為負責人
   *
   * @param shopId - 門店 ID
   * @param thresholdDays - 未回流判定天數（預設 30 天）
   * @returns 工作人員未回流客統計列表
   */
  async getStaffNonReturnStats(
    shopId: number,
    thresholdDays: number = 30
  ): Promise<Array<{ staffId: number; staffName: string; noBackflowCount: number; totalCount: number }>> {
    const rawData: Array<any> = await this.entityManager
      .query(
        `
        SELECT
          s.id AS staffId,
          s.name AS staffName,
          COUNT(DISTINCT latest.member_id) AS totalCount,
          SUM(CASE WHEN m.last_visit IS NULL OR m.last_visit < DATE_SUB(NOW(), INTERVAL ? DAY) THEN 1 ELSE 0 END) AS noBackflowCount
        FROM staff s
        INNER JOIN (
          SELECT a.member_id, a.staff_id
          FROM appointment a
          INNER JOIN (
            SELECT member_id, MAX(id) AS max_id
            FROM appointment
            WHERE shop_id = ?
            GROUP BY member_id
          ) latest_appt ON a.id = latest_appt.max_id
        ) latest ON latest.staff_id = s.id
        INNER JOIN member m ON m.id = latest.member_id AND m.shop_id = ? AND m.status = 1
        WHERE s.shop_id = ?
        GROUP BY s.id, s.name
        ORDER BY noBackflowCount DESC
        `,
        [thresholdDays, shopId, shopId, shopId]
      );

    return rawData.map((item: any) => ({
      staffId: parseInt(item.staffId, 10),
      staffName: item.staffName,
      noBackflowCount: parseInt(item.noBackflowCount, 10),
      totalCount: parseInt(item.totalCount, 10),
    }));
  }

  /**
   * 獲取回流客列表（指定時間範圍內有到店記錄的會員）
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @param page - 當前頁碼
   * @param pageSize - 每頁筆數
   * @returns 回流客列表與總數
   */
  async getBackflowMemberList(
    shopId: number,
    startDate: Date,
    endDate: Date,
    page: number = 1,
    pageSize: number = 10
  ): Promise<[Array<{
    memberId: string;
    memberName: string;
    memberPhone: string;
    memberLevel: string;
    lastConsumeTime: string;
    chargeStaffName: string;
    backflowStatus: string;
  }>, number]> {
    const offset = (page - 1) * pageSize;

    // member 表沒有 staff_id，需透過 appointment 表取最後一次服務的美容師
    const rawData: Array<any> = await this.entityManager
      .query(
        `
        SELECT
          m.id AS memberId,
          m.name AS memberName,
          m.phone AS memberPhone,
          COALESCE(ml.name, '一般會員') AS memberLevel,
          DATE_FORMAT(m.last_visit, '%Y-%m-%d') AS lastConsumeTime,
          COALESCE(s.name, '-') AS chargeStaffName,
          '已回流' AS backflowStatus
        FROM member m
        LEFT JOIN member_level ml ON ml.id = m.level_id
        LEFT JOIN (
          SELECT a1.member_id, a1.staff_id
          FROM appointment a1
          INNER JOIN (
            SELECT member_id, MAX(id) AS max_id
            FROM appointment
            WHERE shop_id = ?
            GROUP BY member_id
          ) a2 ON a1.id = a2.max_id
        ) latest ON latest.member_id = m.id
        LEFT JOIN staff s ON s.id = latest.staff_id
        WHERE m.shop_id = ?
          AND m.last_visit BETWEEN ? AND ?
          AND m.status = 1
        ORDER BY m.last_visit DESC
        LIMIT ? OFFSET ?
        `,
        [shopId, shopId, startDate, endDate, pageSize, offset]
      );

    const total = await this.entityManager
      .createQueryBuilder(Member, 'member')
      .where('member.shop_id = :shopId', { shopId })
      .andWhere('member.last_visit BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('member.status = 1')
      .getCount();

    const items = rawData.map((item: any) => ({
      memberId: String(item.memberId),
      memberName: item.memberName,
      memberPhone: item.memberPhone,
      memberLevel: item.memberLevel,
      lastConsumeTime: item.lastConsumeTime,
      chargeStaffName: item.chargeStaffName,
      backflowStatus: item.backflowStatus,
    }));

    return [items, total];
  }

  /**
   * 獲取未回流客列表（超過指定天數未到店的會員）
   *
   * @param shopId - 門店 ID
   * @param thresholdDays - 未回流判定天數
   * @param page - 當前頁碼
   * @param pageSize - 每頁筆數
   * @returns 未回流客列表與總數
   */
  async getNonReturnMemberList(
    shopId: number,
    thresholdDays: number = 30,
    page: number = 1,
    pageSize: number = 10
  ): Promise<[Array<{
    memberId: string;
    memberName: string;
    memberPhone: string;
    memberLevel: string;
    lastConsumeTime: string;
    chargeStaffName: string;
    noBackflowDays: number;
    lossLevel: string;
  }>, number]> {
    const offset = (page - 1) * pageSize;

    // member 表沒有 staff_id，需透過 appointment 表取最後一次服務的美容師
    const rawData: Array<any> = await this.entityManager
      .query(
        `
        SELECT
          m.id AS memberId,
          m.name AS memberName,
          m.phone AS memberPhone,
          COALESCE(ml.name, '一般會員') AS memberLevel,
          DATE_FORMAT(m.last_visit, '%Y-%m-%d') AS lastConsumeTime,
          COALESCE(s.name, '-') AS chargeStaffName,
          DATEDIFF(NOW(), m.last_visit) AS noBackflowDays,
          CASE
            WHEN DATEDIFF(NOW(), m.last_visit) >= 120 THEN '重度'
            WHEN DATEDIFF(NOW(), m.last_visit) >= 60 THEN '中度'
            ELSE '輕度'
          END AS lossLevel
        FROM member m
        LEFT JOIN member_level ml ON ml.id = m.level_id
        LEFT JOIN (
          SELECT a1.member_id, a1.staff_id
          FROM appointment a1
          INNER JOIN (
            SELECT member_id, MAX(id) AS max_id
            FROM appointment
            WHERE shop_id = ?
            GROUP BY member_id
          ) a2 ON a1.id = a2.max_id
        ) latest ON latest.member_id = m.id
        LEFT JOIN staff s ON s.id = latest.staff_id
        WHERE m.shop_id = ?
          AND (m.last_visit IS NULL OR m.last_visit < DATE_SUB(NOW(), INTERVAL ? DAY))
          AND m.status = 1
        ORDER BY m.last_visit ASC
        LIMIT ? OFFSET ?
        `,
        [shopId, shopId, thresholdDays, pageSize, offset]
      );

    const total = await this.entityManager
      .createQueryBuilder(Member, 'member')
      .where('member.shop_id = :shopId', { shopId })
      .andWhere('(member.last_visit IS NULL OR member.last_visit < DATE_SUB(NOW(), INTERVAL :thresholdDays DAY))', { thresholdDays })
      .andWhere('member.status = 1')
      .getCount();

    const items = rawData.map((item: any) => ({
      memberId: String(item.memberId),
      memberName: item.memberName,
      memberPhone: item.memberPhone,
      memberLevel: item.memberLevel,
      lastConsumeTime: item.lastConsumeTime || '-',
      chargeStaffName: item.chargeStaffName,
      noBackflowDays: parseInt(item.noBackflowDays, 10) || 0,
      lossLevel: item.lossLevel || '輕度',
    }));

    return [items, total];
  }

  /**
   * 獲取回流/未回流核心指標
   *
   * @param shopId - 門店 ID
   * @param thresholdDays - 未回流判定天數
   * @returns 回流客總數、未回流客總數
   */
  async getBackflowMetrics(
    shopId: number,
    thresholdDays: number = 30
  ): Promise<{ totalReturnCount: number; totalNonReturnCount: number }> {
    const now = new Date();
    const thresholdDate = new Date(now);
    thresholdDate.setDate(now.getDate() - thresholdDays);

    const totalReturnCount = await this.entityManager
      .createQueryBuilder(Member, 'member')
      .where('member.shop_id = :shopId', { shopId })
      .andWhere('member.last_visit >= :thresholdDate', { thresholdDate })
      .andWhere('member.status = 1')
      .getCount();

    const totalNonReturnCount = await this.entityManager
      .createQueryBuilder(Member, 'member')
      .where('member.shop_id = :shopId', { shopId })
      .andWhere('(member.last_visit IS NULL OR member.last_visit < :thresholdDate)', { thresholdDate })
      .andWhere('member.status = 1')
      .getCount();

    return { totalReturnCount, totalNonReturnCount };
  }
}
