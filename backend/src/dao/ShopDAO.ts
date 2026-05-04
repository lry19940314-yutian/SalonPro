// ============================================================================
// 美業 SaaS 智慧管理系統 — 門店 DAO
// ============================================================================
// 功能：門店表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { Shop } from '../entity/Shop';

@Provide()
export class ShopDAO {
  @InjectDataSource('default')
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據客戶代碼查詢門店
   *
   * @param code - 客戶代碼
   * @returns 門店實體或 null
   */
  async findByCode(code: string): Promise<Shop | null> {
    return this.entityManager.findOne(Shop, {
      where: { code },
    });
  }

  /**
   * 根據 ID 查詢門店
   *
   * @param id - 門店 ID
   * @returns 門店實體或 null
   */
  async findById(id: number): Promise<Shop | null> {
    return this.entityManager.findOne(Shop, {
      where: { id },
    });
  }

  /**
   * 查詢所有啟用中的門店
   *
   * @returns 門店列表
   */
  async findAllActive(): Promise<Shop[]> {
    return this.entityManager.find(Shop, {
      where: { status: 1 },
    });
  }
}
