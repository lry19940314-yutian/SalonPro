// ============================================================================
// 美業 SaaS 智慧管理系統 — 權限 DAO
// ============================================================================
// 功能：權限表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { Permission } from '../entity/Permission';

@Provide()
export class PermissionDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據角色 ID 查詢該角色擁有的所有權限
   *
   * @param roleId - 角色 ID
   * @returns 權限列表
   */
  async findByRoleId(roleId: number): Promise<Permission[]> {
    return this.entityManager
      .createQueryBuilder(Permission, 'p')
      .innerJoin('p.rolePermissions', 'rp')
      .where('rp.roleId = :roleId', { roleId })
      .getMany();
  }

  /**
   * 根據權限代碼查詢權限
   *
   * @param code - 權限代碼
   * @returns 權限實體或 null
   */
  async findByCode(code: string): Promise<Permission | null> {
    return this.entityManager.findOne(Permission, {
      where: { code },
    });
  }

  /**
   * 查詢指定模組下的所有權限
   *
   * @param module - 模組名稱
   * @returns 權限列表
   */
  async findByModule(module: string): Promise<Permission[]> {
    return this.entityManager.find(Permission, {
      where: { module },
    });
  }
}
