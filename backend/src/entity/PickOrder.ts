// ============================================================================
// 美業 SaaS 智慧管理系統 — 領料單實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('pick_order')
export class PickOrder {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '領料單 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'staff_id', comment: '領料人（美容師）ID' })
  staffId: number;

  @Column({ type: 'varchar', length: 30, unique: true, comment: '領料單號' })
  pickNo: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending', comment: '狀態' })
  status: 'pending' | 'approved' | 'rejected' | 'completed';

  @Column({ type: 'int', default: 0, comment: '項目數量' })
  totalItems: number;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '備註' })
  remark: string;

  @Column({ type: 'bigint', nullable: true, comment: '審批人 ID' })
  approvedBy: number;

  @Column({ type: 'datetime', nullable: true, comment: '審批時間' })
  approvedAt: Date;

  @Column({ type: 'datetime', nullable: true, comment: '完成時間' })
  completedAt: Date;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
