// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員服務
// ============================================================================
// 功能：會員管理、等級計算、資產查詢
// ============================================================================

import { Provide } from '@midwayjs/core';
import { MemberDAO } from '../dao/MemberDAO';
import { MemberLevelDAO } from '../dao/MemberLevelDAO';
import { MemberAssetDAO } from '../dao/MemberAssetDAO';
import { MemberAssetLogDAO } from '../dao/MemberAssetLogDAO';
import { Member } from '../entity/Member';
import { BusinessError, NotFoundError } from '../filter/exception';

@Provide()
export class MemberService {
  constructor(
    private readonly memberDAO: MemberDAO,
    private readonly memberLevelDAO: MemberLevelDAO,
    private readonly memberAssetDAO: MemberAssetDAO,
    private readonly memberAssetLogDAO: MemberAssetLogDAO
  ) {}

  async findById(id: number): Promise<Member> {
    const member = await this.memberDAO.findById(id);
    if (!member) throw new NotFoundError('會員不存在');
    return member;
  }

  async findByShopId(shopId: number, page = 1, pageSize = 20): Promise<{ items: Member[]; total: number }> {
    const [items, total] = await this.memberDAO.findByShopId(shopId, page, pageSize);
    return { items, total };
  }

  async search(params: {
    shopId: number;
    keyword?: string;
    levelId?: number;
    gender?: number;
    status?: number;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Member[]; total: number }> {
    const [items, total] = await this.memberDAO.search(params);
    return { items, total };
  }

  async create(data: {
    shopId: number;
    name: string;
    phone: string;
    birthday?: string;
    gender?: number;
    levelId?: number;
    skinType?: string;
    allergyInfo?: string;
    preferences?: Record<string, unknown>;
    tags?: string[];
    remark?: string;
  }): Promise<Member> {
    const existing = await this.memberDAO.findByPhone(data.phone);
    if (existing) {
      throw new BusinessError('該手機號已註冊為會員');
    }

    const memberNo = await this.generateMemberNo(data.shopId);

    return this.memberDAO.create({
      shopId: data.shopId,
      memberNo,
      name: data.name,
      phone: data.phone,
      birthday: data.birthday,
      gender: data.gender,
      levelId: data.levelId,
      skinType: data.skinType,
      allergyInfo: data.allergyInfo,
      preferences: data.preferences,
      tags: data.tags,
      remark: data.remark,
      status: 1,
    });
  }

  async update(id: number, data: Partial<Member>): Promise<Member> {
    await this.findById(id);
    if (data.phone) {
      const existing = await this.memberDAO.findByPhone(data.phone);
      if (existing && existing.id !== id) {
        throw new BusinessError('該手機號已被其他會員使用');
      }
    }
    const updated = await this.memberDAO.update(id, data);
    if (!updated) throw new BusinessError('更新會員失敗');
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.memberDAO.delete(id);
  }

  async getAssetSummary(memberId: number) {
    return this.memberAssetDAO.getAssetSummary(memberId);
  }

  async getMemberLevels(shopId: number): Promise<import('../entity/MemberLevel').MemberLevel[]> {
    return this.memberLevelDAO.findByShopId(shopId);
  }

  /**
   * 生成會員編號
   */
  private async generateMemberNo(shopId: number): Promise<string> {
    const count = await this.memberDAO.countByShopId(shopId);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `M${dateStr}${String(shopId).padStart(3, '0')}${String(count + 1).padStart(4, '0')}`;
  }
}
