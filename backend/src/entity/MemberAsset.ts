// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員資產實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('member_asset')
export class MemberAsset {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '資產 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'member_id', comment: '會員 ID' })
  memberId: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '所屬門店 ID' })
  shopId: number;

  @Column({ type: 'enum', enum: ['balance', 'course', 'points', 'coupon'], comment: '資產類型' })
  assetType: 'balance' | 'course' | 'points' | 'coupon';

  @Column({ type: 'bigint', nullable: true, comment: '關聯 ID' })
  relatedId: number;

  @Column({ type: 'int', default: 0, comment: '總數量' })
  totalQuantity: number;

  @Column({ type: 'int', default: 0, comment: '已使用數量' })
  usedQuantity: number;

  @Column({ type: 'int', default: 0, comment: '已過期數量' })
  expiredQuantity: number;

  @Column({ type: 'date', nullable: true, comment: '到期日期' })
  expiryDate: string;

  @Column({ type: 'tinyint', default: 1, comment: '狀態：1=有效，0=已用完，2=已過期' })
  status: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '備註' })
  remark: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
