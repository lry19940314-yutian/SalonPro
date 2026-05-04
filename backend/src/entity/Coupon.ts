// ============================================================================
// 美業 SaaS 智慧管理系統 — 優惠券定義實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('coupon')
export class Coupon {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '優惠券 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '所屬門店 ID' })
  shopId: number;

  @Column({ type: 'varchar', length: 100, comment: '優惠券名稱' })
  name: string;

  @Column({ type: 'enum', enum: ['discount', 'deduction', 'gift'], comment: '類型' })
  type: 'discount' | 'deduction' | 'gift';

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '優惠值' })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '使用門檻' })
  conditionAmount: number;

  @Column({ type: 'int', nullable: true, comment: '領取後有效天數' })
  validDays: number;

  @Column({ type: 'date', nullable: true, comment: '有效起始日期' })
  validStart: string;

  @Column({ type: 'date', nullable: true, comment: '有效截止日期' })
  validEnd: string;

  @Column({ type: 'int', default: 0, comment: '發行總數量（0=不限量）' })
  totalQuantity: number;

  @Column({ type: 'int', default: 0, comment: '已使用數量' })
  usedQuantity: number;

  @Column({ type: 'tinyint', default: 1, comment: '狀態：1=啟用，0=停用' })
  status: number;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '活動說明' })
  description: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
