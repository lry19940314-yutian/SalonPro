// ============================================================================
// 美業 SaaS 智慧管理系統 — 員工門店關聯服務
// ============================================================================
// 功能：員工門店歸屬管理
// ============================================================================

import { Provide } from '@midwayjs/core';
import { StaffShopDAO } from '../dao/StaffShopDAO';
import { StaffShop } from '../entity/StaffShop';
import { BusinessError } from '../filter/exception';

@Provide()
export class StaffShopService {
  constructor(
    private readonly staffShopDAO: StaffShopDAO
  ) {}

  /**
   * 根據員工 ID 查詢關聯門店
   */
  async findByStaffId(staffId: number): Promise<StaffShop[]> {
    return this.staffShopDAO.findByStaffId(staffId);
  }

  /**
   * 根據門店 ID 查詢關聯員工
   */
  async findByShopId(shopId: number): Promise<StaffShop[]> {
    return this.staffShopDAO.findByShopId(shopId);
  }

  /**
   * 查詢員工的主門店
   */
  async findPrimaryByStaffId(staffId: number): Promise<StaffShop | null> {
    return this.staffShopDAO.findPrimaryByStaffId(staffId);
  }

  /**
   * 關聯員工到門店
   */
  async assign(data: {
    staffId: number;
    shopId: number;
    isPrimary?: boolean;
  }): Promise<StaffShop> {
    const existing = await this.staffShopDAO.findByStaffId(data.staffId);
    const isFirst = existing.length === 0;

    // 如果是主門店，先取消其他主門店標記
    if (data.isPrimary) {
      for (const rel of existing) {
        if (rel.isPrimary) {
          await this.staffShopDAO.update(rel.id, { isPrimary: 0 } as any);
        }
      }
    }

    return this.staffShopDAO.create({
      staffId: data.staffId,
      shopId: data.shopId,
      isPrimary: data.isPrimary || isFirst ? 1 : 0,
    });
  }

  /**
   * 更新關聯信息
   */
  async update(id: number, data: { isPrimary?: boolean }): Promise<StaffShop> {
    const rel = await this.staffShopDAO.findById(id);
    if (!rel) {
      throw new BusinessError('員工門店關聯不存在');
    }

    if (data.isPrimary) {
      // 取消該員工的其他主門店
      const all = await this.staffShopDAO.findByStaffId(rel.staffId);
      for (const r of all) {
        if (r.id !== id && r.isPrimary) {
          await this.staffShopDAO.update(r.id, { isPrimary: 0 } as any);
        }
      }
    }

    const updated = await this.staffShopDAO.update(id, {
      isPrimary: data.isPrimary ? 1 : 0,
    } as any);
    if (!updated) {
      throw new BusinessError('更新員工門店關聯失敗');
    }
    return updated;
  }

  /**
   * 解除員工門店關聯
   */
  async remove(id: number): Promise<void> {
    const rel = await this.staffShopDAO.findById(id);
    if (!rel) {
      throw new BusinessError('員工門店關聯不存在');
    }
    await this.staffShopDAO.delete(id);
  }

  /**
   * 解除員工所有門店關聯
   */
  async removeByStaffId(staffId: number): Promise<void> {
    await this.staffShopDAO.deleteByStaffId(staffId);
  }
}
