// ============================================================================
// 美業 SaaS 智慧管理系統 — 領料明細實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('pick_item')
export class PickItem {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '明細 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'pick_order_id', comment: '領料單 ID' })
  pickOrderId: number;

  @Column({ type: 'bigint', name: 'product_id', comment: '產品 ID' })
  productId: number;

  @Column({ type: 'bigint', nullable: true, comment: '庫存記錄 ID' })
  inventoryId: number;

  @Column({ type: 'int', comment: '領料數量' })
  quantity: number;

  @Column({ type: 'varchar', length: 10, default: '個', comment: '單位' })
  unit: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '備註' })
  remark: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;
}
