// ============================================================================
// 美業 SaaS 智慧管理系統 — 預約支付記錄實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('appointment_payment')
export class AppointmentPayment {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '支付 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'appointment_id', comment: '預約 ID' })
  appointmentId: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'varchar', length: 30, unique: true, comment: '支付流水號' })
  paymentNo: string;

  @Column({ type: 'varchar', length: 20, comment: '支付方式' })
  paymentMethod: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '支付金額' })
  amount: number;

  @Column({ type: 'datetime', comment: '支付時間' })
  paymentTime: Date;

  @Column({ type: 'enum', enum: ['success', 'failed', 'refunded'], default: 'success', comment: '支付狀態' })
  status: 'success' | 'failed' | 'refunded';

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '備註' })
  remark: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;
}
