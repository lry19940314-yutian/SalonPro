// ============================================================================
// 美業 SaaS 智慧管理系統 — 抽成明細實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('commission')
export class Commission {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '抽成 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'staff_id', comment: '美容師 ID' })
  staffId: number;

  @Column({ type: 'bigint', nullable: true, comment: '關聯業績 ID' })
  performanceId: number;

  @Column({ type: 'enum', enum: ['service_commission', 'product_commission', 'bonus', 'deduction'], comment: '抽成類型' })
  type: 'service_commission' | 'product_commission' | 'bonus' | 'deduction';

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '抽成金額' })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: '抽成比例（%）' })
  rate: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '說明' })
  description: string;

  @Column({ type: 'tinyint', default: 0, comment: '是否已結算：1=是，0=否' })
  settled: number;

  @Column({ type: 'datetime', nullable: true, comment: '結算時間' })
  settledAt: Date;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;
}
