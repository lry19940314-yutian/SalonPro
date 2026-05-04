// ============================================================================
// 美業 SaaS 智慧管理系統 — 角色 DAO
// ============================================================================
// 功能：角色表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { Role } from '../entity/Role';

@Provide()
export class RoleDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據角色代碼查詢角色
   *
   * @param code - 角色代碼（manager / beautician）
   * @returns 角色實體或 null
   */
  async findByCode(code: string): Promise<Role | null> {
    return this.entityManager.findOne(Role, {
      where: { code },
    });
  }

  /**
   * 根據 ID 查詢角色
   *
   * @param id - 角色 ID
   * @returns 角色實體或 null
   */
  async findById(id: number): Promise<Role | null> {
    return this.entityManager.findOne(Role, {
      where: { id },
    });
  }
}
