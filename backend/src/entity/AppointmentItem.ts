// ============================================================================
// 美業 SaaS 智慧管理系統 — 預約項目明細實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('appointment_item')
export class AppointmentItem {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '明細 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'appointment_id', comment: '預約 ID' })
  appointmentId: number;

  @Column({ type: 'enum', enum: ['service', 'product'], comment: '項目類型' })
  itemType: 'service' | 'product';

  @Column({ type: 'bigint', nullable: true, comment: '服務項目 ID' })
  serviceId: number;

  @Column({ type: 'bigint', nullable: true, comment: '產品 ID' })
  productId: number;

  @Column({ type: 'varchar', length: 100, comment: '項目名稱（快照）' })
  name: string;

  @Column({ type: 'int', default: 1, comment: '數量' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '單價' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '小計金額' })
  subtotal: number;

  @Column({ type: 'int', nullable: true, comment: '時長（分鐘）' })
  duration: number;

  @Column({ type: 'bigint', nullable: true, comment: '服務美容師' })
  staffId: number;

  @Column({ type: 'int', default: 0, comment: '排序序號' })
  sortOrder: number;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;
}
