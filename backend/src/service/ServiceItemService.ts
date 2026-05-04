// ============================================================================
// 美業 SaaS 智慧管理系統 — 服務項目服務
// ============================================================================
// 功能：服務項目的 CRUD 業務邏輯
// ============================================================================

import { Provide } from '@midwayjs/core';
import { ServiceItemDAO } from '../dao/ServiceItemDAO';
import { ServiceItem } from '../entity/ServiceItem';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class ServiceItemService {
  constructor(
    private readonly serviceItemDAO: ServiceItemDAO
  ) {}

  async findById(id: number): Promise<ServiceItem> {
    const item = await this.serviceItemDAO.findById(id);
    if (!item) throw new NotFoundError('服務項目不存在');
    return item;
  }

  async findByShopId(shopId: number): Promise<ServiceItem[]> {
    return this.serviceItemDAO.findByShopId(shopId);
  }

  async findByCategoryId(categoryId: number): Promise<ServiceItem[]> {
    return this.serviceItemDAO.findByCategoryId(categoryId);
  }

  async findActiveByShopId(shopId: number): Promise<ServiceItem[]> {
    return this.serviceItemDAO.findActiveByShopId(shopId);
  }

  async search(shopId: number, keyword: string): Promise<ServiceItem[]> {
    return this.serviceItemDAO.searchByName(shopId, keyword);
  }

  async create(data: {
    shopId: number;
    categoryId: number;
    name: string;
    duration: number;
    price: number;
    color?: string;
    commissionType?: 'fixed' | 'percent';
    commissionValue?: number;
    sortOrder?: number;
    status?: number;
  }): Promise<ServiceItem> {
    const maxOrder = await this.serviceItemDAO.getMaxSortOrder(data.shopId);
    return this.serviceItemDAO.create({
      shopId: data.shopId,
      categoryId: data.categoryId,
      name: data.name,
      duration: data.duration,
      price: data.price,
      color: data.color,
      commissionType: data.commissionType,
      commissionValue: data.commissionValue,
      sortOrder: data.sortOrder ?? maxOrder + 1,
      status: data.status ?? 1,
    });
  }

  async update(id: number, data: Partial<ServiceItem>): Promise<ServiceItem> {
    await this.findById(id);
    const updated = await this.serviceItemDAO.update(id, data);
    if (!updated) throw new BusinessError('更新服務項目失敗');
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.serviceItemDAO.delete(id);
  }
}
