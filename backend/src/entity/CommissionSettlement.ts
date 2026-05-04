// ============================================================================
// 美業 SaaS 智慧管理系統 — 抽成結算實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('commission_settlement')
export class CommissionSettlement {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '結算 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'staff_id', comment: '美容師 ID' })
  staffId: number;

  @Column({ type: 'date', comment: '結算週期起始日' })
  periodStart: string;

  @Column({ type: 'date', comment: '結算週期結束日' })
  periodEnd: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '抽成總額' })
  totalCommission: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '獎金總額' })
  totalBonus: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '扣款總額' })
  totalDeduction: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '實發金額' })
  netAmount: number;

  @Column({ type: 'enum', enum: ['pending', 'confirmed', 'paid'], default: 'pending', comment: '狀態' })
  status: 'pending' | 'confirmed' | 'paid';

  @Column({ type: 'bigint', nullable: true, comment: '確認人' })
  confirmedBy: number;

  @Column({ type: 'datetime', nullable: true, comment: '確認時間' })
  confirmedAt: Date;

  @Column({ type: 'datetime', nullable: true, comment: '發放時間' })
  paidAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '備註' })
  remark: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
