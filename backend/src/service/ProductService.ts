// ============================================================================
// 美業 SaaS 智慧管理系統 — 產品服務
// ============================================================================

import { Provide } from '@midwayjs/core';
import { ProductDAO } from '../dao/ProductDAO';
import { Product } from '../entity/Product';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class ProductService {
  constructor(
    private readonly productDAO: ProductDAO
  ) {}

  async findById(id: number): Promise<Product> {
    const product = await this.productDAO.findById(id);
    if (!product) throw new NotFoundError('產品不存在');
    return product;
  }

  async findByShopId(shopId: number): Promise<Product[]> {
    return this.productDAO.findByShopId(shopId);
  }

  async findByCategoryId(categoryId: number): Promise<Product[]> {
    return this.productDAO.findByCategoryId(categoryId);
  }

  async search(shopId: number, keyword: string): Promise<Product[]> {
    return this.productDAO.search(shopId, keyword);
  }

  async findLowStock(shopId: number): Promise<Product[]> {
    return this.productDAO.findLowStock(shopId);
  }

  async create(data: {
    shopId: number;
    categoryId?: number;
    name: string;
    barcode?: string;
    brand?: string;
    specification?: string;
    unit?: string;
    costPrice?: number;
    sellingPrice: number;
    commissionType?: 'fixed' | 'percent';
    commissionValue?: number;
    status?: number;
  }): Promise<Product> {
    if (data.barcode) {
      const existing = await this.productDAO.findByBarcode(data.barcode);
      if (existing) {
        throw new BusinessError('條碼已存在');
      }
    }
    return this.productDAO.create({
      shopId: data.shopId,
      categoryId: data.categoryId,
      name: data.name,
      barcode: data.barcode,
      brand: data.brand,
      specification: data.specification,
      unit: data.unit,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      commissionType: data.commissionType,
      commissionValue: data.commissionValue,
      status: data.status ?? 1,
    });
  }

  async update(id: number, data: Partial<Product>): Promise<Product> {
    await this.findById(id);
    if (data.barcode) {
      const existing = await this.productDAO.findByBarcode(data.barcode);
      if (existing && existing.id !== id) {
        throw new BusinessError('條碼已被其他產品使用');
      }
    }
    const updated = await this.productDAO.update(id, data);
    if (!updated) throw new BusinessError('更新產品失敗');
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.productDAO.delete(id);
  }
}
