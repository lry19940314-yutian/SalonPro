// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員等級服務
// ============================================================================
// 功能：會員等級的 CRUD 業務邏輯、等級自動升級
// ============================================================================

import { Provide } from '@midwayjs/core';
import { MemberLevelDAO } from '../dao/MemberLevelDAO';
import { MemberDAO } from '../dao/MemberDAO';
import { MemberLevel } from '../entity/MemberLevel';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class MemberLevelService {
  constructor(
    private readonly memberLevelDAO: MemberLevelDAO,
    private readonly memberDAO: MemberDAO
  ) {}

  /**
   * 根據 ID 查詢會員等級
   */
  async findById(id: number): Promise<MemberLevel> {
    const level = await this.memberLevelDAO.findById(id);
    if (!level) {
      throw new NotFoundError('會員等級不存在');
    }
    return level;
  }

  /**
   * 根據門店 ID 查詢所有會員等級
   */
  async findByShopId(shopId: number): Promise<MemberLevel[]> {
    return this.memberLevelDAO.findByShopId(shopId);
  }

  /**
   * 根據等級值查詢
   */
  async findByLevel(shopId: number, level: number): Promise<MemberLevel | null> {
    return this.memberLevelDAO.findByLevel(shopId, level);
  }

  /**
   * 創建會員等級
   */
  async create(data: {
    shopId: number;
    name: string;
    level: number;
    minConsumption: number;
    discountRate?: number;
    color?: string;
    benefits?: string[];
  }): Promise<MemberLevel> {
    const existing = await this.memberLevelDAO.findByLevel(data.shopId, data.level);
    if (existing) {
      throw new BusinessError('該等級值已存在');
    }
    return this.memberLevelDAO.create(data);
  }

  /**
   * 更新會員等級
   */
  async update(id: number, data: Partial<MemberLevel>): Promise<MemberLevel> {
    await this.findById(id);
    const updated = await this.memberLevelDAO.update(id, data);
    if (!updated) {
      throw new BusinessError('更新會員等級失敗');
    }
    return updated;
  }

  /**
   * 刪除會員等級
   */
  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.memberLevelDAO.delete(id);
  }

  /**
   * 根據消費金額自動匹配等級
   */
  async autoMatchLevel(shopId: number, consumption: number): Promise<MemberLevel | null> {
    return this.memberLevelDAO.findLevelByConsumption(shopId, consumption);
  }

  /**
   * 更新會員等級（根據消費金額自動升級）
   */
  async updateMemberLevel(memberId: number): Promise<void> {
    const member = await this.memberDAO.findById(memberId);
    if (!member) {
      throw new NotFoundError('會員不存在');
    }
    const level = await this.autoMatchLevel(member.shopId, member.totalConsumption);
    if (level && (!member.levelId || level.level > (await this.getMemberLevelValue(member.levelId)))) {
      await this.memberDAO.update(memberId, { levelId: level.id } as any);
    }
  }

  /**
   * 獲取等級值
   */
  private async getMemberLevelValue(levelId: number): Promise<number> {
    const level = await this.memberLevelDAO.findById(levelId);
    return level ? level.level : 0;
  }
}
