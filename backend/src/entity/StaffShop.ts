// ============================================================================
// 美業 SaaS 智慧管理系統 — 員工門店關聯實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('staff_shop')
export class StaffShop {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '關聯 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'staff_id', comment: '員工 ID' })
  staffId: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'tinyint', default: 1, comment: '是否主要門店：1=是，0=否' })
  isPrimary: number;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;
}
