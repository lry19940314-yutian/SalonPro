// ============================================================================
// 美業 SaaS 智慧管理系統 — 請假記錄實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('leave')
export class Leave {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '請假 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'staff_id', comment: '請假美容師 ID' })
  staffId: number;

  @Column({ type: 'enum', enum: ['annual', 'sick', 'personal', 'other'], comment: '請假類型' })
  type: 'annual' | 'sick' | 'personal' | 'other';

  @Column({ type: 'date', comment: '請假起始日期' })
  startDate: string;

  @Column({ type: 'date', comment: '請假結束日期' })
  endDate: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '請假原因' })
  reason: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending', comment: '審批狀態' })
  status: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'bigint', nullable: true, comment: '審批人 ID' })
  approvedBy: number;

  @Column({ type: 'datetime', nullable: true, comment: '審批時間' })
  approvedAt: Date;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
