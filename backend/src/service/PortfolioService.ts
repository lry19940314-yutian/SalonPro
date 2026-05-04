// ============================================================================
// 美業 SaaS 智慧管理系統 — 作品集服務
// ============================================================================
// 功能：作品集管理、媒體上傳記錄
// ============================================================================

import { Provide } from '@midwayjs/core';
import { PortfolioDAO } from '../dao/PortfolioDAO';
import { Portfolio } from '../entity/Portfolio';
import { NotFoundError } from '../filter/exception';

@Provide()
export class PortfolioService {
  constructor(
    private readonly portfolioDAO: PortfolioDAO
  ) {}

  /**
   * 根據 ID 查詢作品
   */
  async findById(id: number): Promise<Portfolio> {
    const portfolio = await this.portfolioDAO.findById(id);
    if (!portfolio) {
      throw new NotFoundError('作品不存在');
    }
    return portfolio;
  }

  /**
   * 根據美容師 ID 查詢作品
   */
  async findByStaffId(staffId: number): Promise<Portfolio[]> {
    return this.portfolioDAO.findByStaffId(staffId);
  }

  /**
   * 根據門店查詢作品（分頁）
   */
  async findByShopId(shopId: number, page = 1, pageSize = 20): Promise<{ items: Portfolio[]; total: number }> {
    const [items, total] = await this.portfolioDAO.findByShopId(shopId, page, pageSize);
    return { items, total };
  }

  /**
   * 根據媒體類型查詢
   */
  async findByMediaType(shopId: number, mediaType: 'image' | 'video'): Promise<Portfolio[]> {
    return this.portfolioDAO.findByMediaType(shopId, mediaType);
  }

  /**
   * 創建作品
   */
  async create(data: {
    shopId: number;
    staffId?: number;
    mediaType: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    title?: string;
    description?: string;
    serviceIds?: number[];
  }): Promise<Portfolio> {
    return this.portfolioDAO.create(data);
  }

  /**
   * 更新作品
   */
  async update(id: number, data: Partial<Portfolio>): Promise<Portfolio> {
    await this.findById(id);
    const updated = await this.portfolioDAO.update(id, data);
    if (!updated) {
      throw new Error('更新作品失敗');
    }
    return updated;
  }

  /**
   * 刪除作品
   */
  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.portfolioDAO.delete(id);
  }
}
