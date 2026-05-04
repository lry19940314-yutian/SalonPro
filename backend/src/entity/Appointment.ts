// ============================================================================
// 美業 SaaS 智慧管理系統 — 預約訂單實體（核心交易表）
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('appointment')
export class Appointment {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '預約 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'member_id', comment: '會員 ID' })
  memberId: number;

  @Column({ type: 'bigint', name: 'staff_id', comment: '美容師 ID' })
  staffId: number;

  @Column({ type: 'bigint', name: 'schedule_id', nullable: true, comment: '場務表 ID' })
  scheduleId: number;

  @Column({ type: 'varchar', length: 30, unique: true, comment: '訂單編號' })
  orderNo: string;

  @Column({ type: 'enum', enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'], default: 'pending', comment: '預約狀態' })
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

  @Column({ type: 'int', default: 0, comment: '總時長（分鐘）' })
  totalDuration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '總金額' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '折扣金額' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '實收金額' })
  finalAmount: number;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '支付方式' })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '備註' })
  remark: string;

  @Column({ type: 'date', comment: '預約日期' })
  appointmentDate: string;

  @Column({ type: 'time', comment: '開始時間' })
  startTime: string;

  @Column({ type: 'time', comment: '結束時間' })
  endTime: string;

  @Column({ type: 'datetime', nullable: true, comment: '服務完成時間' })
  completedAt: Date;

  @Column({ type: 'datetime', nullable: true, comment: '取消時間' })
  cancelledAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '取消原因' })
  cancelReason: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
