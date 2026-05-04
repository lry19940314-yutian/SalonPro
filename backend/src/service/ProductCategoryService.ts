// ============================================================================
// 美業 SaaS 智慧管理系統 — 產品分類服務
// ============================================================================

import { Provide } from '@midwayjs/core';
import { ProductCategoryDAO } from '../dao/ProductCategoryDAO';
import { ProductCategory } from '../entity/ProductCategory';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class ProductCategoryService {
  constructor(
    private readonly productCategoryDAO: ProductCategoryDAO
  ) {}

  async findById(id: number): Promise<ProductCategory> {
    const category = await this.productCategoryDAO.findById(id);
    if (!category) throw new NotFoundError('產品分類不存在');
    return category;
  }

  async findByShopId(shopId: number): Promise<ProductCategory[]> {
    return this.productCategoryDAO.findByShopId(shopId);
  }

  async findActiveByShopId(shopId: number): Promise<ProductCategory[]> {
    return this.productCategoryDAO.findActiveByShopId(shopId);
  }

  async create(data: {
    shopId: number;
    name: string;
    sortOrder?: number;
    status?: number;
  }): Promise<ProductCategory> {
    const maxOrder = await this.productCategoryDAO.getMaxSortOrder(data.shopId);
    return this.productCategoryDAO.create({
      shopId: data.shopId,
      name: data.name,
      sortOrder: data.sortOrder ?? maxOrder + 1,
      status: data.status ?? 1,
    });
  }

  async update(id: number, data: Partial<ProductCategory>): Promise<ProductCategory> {
    await this.findById(id);
    const updated = await this.productCategoryDAO.update(id, data);
    if (!updated) throw new BusinessError('更新產品分類失敗');
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.productCategoryDAO.delete(id);
  }
}
