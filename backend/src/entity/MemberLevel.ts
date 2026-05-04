// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員等級實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('member_level')
export class MemberLevel {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '等級 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '所屬門店 ID' })
  shopId: number;

  @Column({ type: 'varchar', length: 50, comment: '等級名稱' })
  name: string;

  @Column({ type: 'int', default: 1, comment: '等級數值' })
  level: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '升級最低消費門檻' })
  minConsumption: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: '折扣率' })
  discountRate: number;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '等級標籤顏色' })
  color: string;

  @Column({ type: 'json', nullable: true, comment: '權益描述' })
  benefits: string[];

  @Column({ type: 'tinyint', default: 1, comment: '狀態：1=啟用，0=停用' })
  status: number;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
