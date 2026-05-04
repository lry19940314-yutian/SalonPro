// ============================================================================
// 美業 SaaS 智慧管理系統 — 業績記錄實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('performance')
export class Performance {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '業績 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'staff_id', comment: '美容師 ID' })
  staffId: number;

  @Column({ type: 'bigint', name: 'appointment_id', comment: '關聯預約 ID' })
  appointmentId: number;

  @Column({ type: 'bigint', name: 'appointment_item_id', nullable: true, comment: '關聯預約明細 ID' })
  appointmentItemId: number;

  @Column({ type: 'enum', enum: ['service', 'product'], comment: '業績類型' })
  type: 'service' | 'product';

  @Column({ type: 'bigint', nullable: true, comment: '分類 ID' })
  categoryId: number;

  @Column({ type: 'varchar', length: 100, comment: '項目名稱（快照）' })
  itemName: string;

  @Column({ type: 'int', default: 1, comment: '數量' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '業績金額' })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: '抽成比例（%）' })
  commissionRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '抽成金額' })
  commissionAmount: number;

  @Column({ type: 'date', comment: '業績歸屬日期' })
  performanceDate: string;

  @Column({ type: 'tinyint', default: 0, comment: '是否已結算：1=是，0=否' })
  settled: number;

  @Column({ type: 'datetime', nullable: true, comment: '結算時間' })
  settledAt: Date;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;
}
