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
}
