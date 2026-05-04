// ============================================================================
// 美業 SaaS 智慧管理系統 — 庫存變動日誌實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('inventory_log')
export class InventoryLog {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '日誌 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'product_id', comment: '產品 ID' })
  productId: number;

  @Column({ type: 'bigint', nullable: true, comment: '庫存記錄 ID' })
  inventoryId: number;

  @Column({ type: 'enum', enum: ['inbound', 'outbound', 'pick', 'return', 'check', 'adjustment'], comment: '變動類型' })
  changeType: 'inbound' | 'outbound' | 'pick' | 'return' | 'check' | 'adjustment';

  @Column({ type: 'int', comment: '變動數量' })
  quantityChange: number;

  @Column({ type: 'int', comment: '變動後庫存' })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 30, nullable: true, comment: '關聯單號' })
  referenceNo: string;

  @Column({ type: 'bigint', nullable: true, comment: '操作人員 ID' })
  operatorId: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '備註' })
  remark: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;
}
