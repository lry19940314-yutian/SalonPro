// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員 DAO
// ============================================================================
// 功能：會員表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource, In, Like, Between } from 'typeorm';
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
   *
   * @param id - 會員 ID
   * @returns 會員實體或 null
   */
  async findById(id: number): Promise<Member | null> {
    return this.entityManager.findOne(Member, {
      where: { id },
    });
  }

  /**
   * 根據門店 ID 查詢所有會員
   *
   * @param shopId - 門店 ID
   * @param page - 頁碼
   * @param pageSize - 每頁數量
   * @returns 會員列表及總數
   */
  async findByShopId(
    shopId: number,
    page = 1,
    pageSize = 20
  ): Promise<[Member[], number]> {
    return this.entityManager.findAndCount(Member, {
      where: { shopId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * 根據手機號查詢會員
   *
   * @param phone - 手機號
   * @returns 會員實體或 null
   */
  async findByPhone(phone: string): Promise<Member | null> {
    return this.entityManager.findOne(Member, {
      where: { phone },
    });
  }

  /**
   * 根據會員編號查詢
   *
   * @param memberNo - 會員編號
   * @returns 會員實體或 null
   */
  async findByMemberNo(memberNo: string): Promise<Member | null> {
    return this.entityManager.findOne(Member, {
      where: { memberNo },
    });
  }

  /**
   * 根據 ID 列表批量查詢
   *
   * @param ids - 會員 ID 列表
   * @returns 會員列表
   */
  async findByIds(ids: number[]): Promise<Member[]> {
    return this.entityManager.find(Member, {
      where: { id: In(ids) },
    });
  }

  /**
   * 多條件搜索會員
   *
   * @param params - 搜索參數
   * @returns 會員列表及總數
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
    const queryBuilder = this.entityManager
      .createQueryBuilder(Member, 'member')
      .where('member.shopId = :shopId', { shopId: params.shopId });

    if (params.keyword) {
      queryBuilder.andWhere(
        '(member.name LIKE :keyword OR member.phone LIKE :keyword OR member.memberNo LIKE :keyword)',
        { keyword: `%${params.keyword}%` }
      );
    }

    if (params.levelId) {
      queryBuilder.andWhere('member.levelId = :levelId', { levelId: params.levelId });
    }

    if (params.gender !== undefined) {
      queryBuilder.andWhere('member.gender = :gender', { gender: params.gender });
    }

    if (params.status !== undefined) {
      queryBuilder.andWhere('member.status = :status', { status: params.status });
    }

    if (params.startDate) {
      queryBuilder.andWhere('member.createdAt >= :startDate', { startDate: params.startDate });
    }

    if (params.endDate) {
      queryBuilder.andWhere('member.createdAt <= :endDate', { endDate: params.endDate });
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    return queryBuilder
      .orderBy('member.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
  }

  /**
   * 創建會員
   *
   * @param member - 會員實體
   * @returns 創建後的會員
   */
  async create(member: Partial<Member>): Promise<Member> {
    const entity = this.entityManager.create(Member, member);
    return this.entityManager.save(entity);
  }

  /**
   * 更新會員
   *
   * @param id - 會員 ID
   * @param data - 更新數據
   * @returns 更新後的會員
   */
  async update(id: number, data: Partial<Member>): Promise<Member | null> {
    await this.entityManager.update(Member, id, data as any);
    return this.findById(id);
  }

  /**
   * 刪除會員
   *
   * @param id - 會員 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(Member, id);
  }

  /**
   * 更新會員累計消費
   *
   * @param id - 會員 ID
   * @param amount - 消費金額
   */
  async updateConsumption(id: number, amount: number): Promise<void> {
    await this.entityManager
      .createQueryBuilder()
      .update(Member)
      .set({
        totalConsumption: () => `total_consumption + ${amount}`,
        visitCount: () => 'visit_count + 1',
        lastVisitAt: () => 'NOW()',
      })
      .where('id = :id', { id })
      .execute();
  }

  /**
   * 獲取指定門店的會員總數
   *
   * @param shopId - 門店 ID
   * @returns 會員總數
   */
  async countByShopId(shopId: number): Promise<number> {
    return this.entityManager.count(Member, {
      where: { shopId },
    });
  }

  /**
   * 獲取指定時間範圍內的新增會員數
   *
   * @param shopId - 門店 ID
   * @param startDate - 開始日期
   * @param endDate - 結束日期
   * @returns 新增會員數
   */
  async countNewMembers(shopId: number, startDate: Date, endDate: Date): Promise<number> {
    return this.entityManager.count(Member, {
      where: {
        shopId,
        createdAt: Between(startDate, endDate),
      },
    });
  }
}
