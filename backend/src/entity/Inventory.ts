// ============================================================================
// 美業 SaaS 智慧管理系統 — 庫存記錄實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '庫存 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'product_id', comment: '產品 ID' })
  productId: number;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '批次號' })
  batchNo: string;

  @Column({ type: 'int', default: 0, comment: '當前庫存數量' })
  quantity: number;

  @Column({ type: 'int', default: 0, comment: '最低庫存預警數量' })
  minQuantity: number;

  @Column({ type: 'varchar', length: 10, default: '個', comment: '單位' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '成本價' })
  costPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '售價' })
  sellingPrice: number;

  @Column({ type: 'date', nullable: true, comment: '有效日期' })
  expiryDate: string;

  @Column({ type: 'enum', enum: ['normal', 'low', 'out_of_stock', 'expired'], default: 'normal', comment: '庫存狀態' })
  status: 'normal' | 'low' | 'out_of_stock' | 'expired';

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
