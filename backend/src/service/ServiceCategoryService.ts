// ============================================================================
// 美業 SaaS 智慧管理系統 — 服務分類服務
// ============================================================================
// 功能：服務分類的 CRUD 業務邏輯
// ============================================================================

import { Provide } from '@midwayjs/core';
import { ServiceCategoryDAO } from '../dao/ServiceCategoryDAO';
import { ServiceCategory } from '../entity/ServiceCategory';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class ServiceCategoryService {
  constructor(
    private readonly serviceCategoryDAO: ServiceCategoryDAO
  ) {}

  /**
   * 根據 ID 查詢服務分類
   */
  async findById(id: number): Promise<ServiceCategory> {
    const category = await this.serviceCategoryDAO.findById(id);
    if (!category) {
      throw new NotFoundError('服務分類不存在');
    }
    return category;
  }

  /**
   * 根據門店 ID 查詢所有服務分類
   */
  async findByShopId(shopId: number): Promise<ServiceCategory[]> {
    return this.serviceCategoryDAO.findByShopId(shopId);
  }

  /**
   * 查詢啟用中的服務分類
   */
  async findActiveByShopId(shopId: number): Promise<ServiceCategory[]> {
    return this.serviceCategoryDAO.findActiveByShopId(shopId);
  }

  /**
   * 創建服務分類
   */
  async create(data: {
    shopId: number;
    name: string;
    sortOrder?: number;
    status?: number;
  }): Promise<ServiceCategory> {
    const maxOrder = await this.serviceCategoryDAO.getMaxSortOrder(data.shopId);
    return this.serviceCategoryDAO.create({
      shopId: data.shopId,
      name: data.name,
      sortOrder: data.sortOrder ?? maxOrder + 1,
      status: data.status ?? 1,
    });
  }

  /**
   * 更新服務分類
   */
  async update(id: number, data: Partial<ServiceCategory>): Promise<ServiceCategory> {
    await this.findById(id); // 確保存在
    const updated = await this.serviceCategoryDAO.update(id, data);
    if (!updated) {
      throw new BusinessError('更新服務分類失敗');
    }
    return updated;
  }

  /**
   * 刪除服務分類
   */
  async delete(id: number): Promise<void> {
    await this.findById(id); // 確保存在
    await this.serviceCategoryDAO.delete(id);
  }
}
