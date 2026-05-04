// ============================================================================
// 美業 SaaS 智慧管理系統 — 員工 DAO
// ============================================================================
// 功能：員工表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { Staff } from '../entity/Staff';

@Provide()
export class StaffDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據登錄帳號查詢員工（含關聯的門店和角色資訊）
   *
   * @param username - 登錄帳號
   * @returns 員工實體（含 shop 和 role 關聯）或 null
   */
  async findByUsername(username: string): Promise<Staff | null> {
    return this.entityManager.findOne(Staff, {
      where: { username },
      relations: ['shop', 'role'],
    });
  }

  /**
   * 根據 ID 查詢員工
   *
   * @param id - 員工 ID
   * @returns 員工實體或 null
   */
  async findById(id: number): Promise<Staff | null> {
    return this.entityManager.findOne(Staff, {
      where: { id },
      relations: ['shop', 'role'],
    });
  }

  /**
   * 根據門店 ID 查詢該門店所有員工
   *
   * @param shopId - 門店 ID
   * @returns 員工列表
   */
  async findByShopId(shopId: number): Promise<Staff[]> {
    return this.entityManager.find(Staff, {
      where: { shopId },
      relations: ['role'],
    });
  }

  /**
   * 更新員工最後登錄時間
   *
   * @param staffId - 員工 ID
   */
  async updateLastLogin(staffId: number): Promise<void> {
    await this.entityManager.update(
      Staff,
      { id: staffId },
      { lastLogin: new Date() }
    );
  }
}
