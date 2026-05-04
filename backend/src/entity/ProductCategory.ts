// ============================================================================
// 美業 SaaS 智慧管理系統 — 產品分類實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Product } from './Product';

@Entity('product_category')
export class ProductCategory {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '分類 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '所屬門店 ID' })
  shopId: number;

  @Column({ type: 'varchar', length: 50, comment: '分類名稱' })
  name: string;

  @Column({ type: 'int', default: 0, comment: '排序序號' })
  sortOrder: number;

  @Column({ type: 'tinyint', default: 1, comment: '狀態：1=啟用，0=停用' })
  status: number;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;

  @OneToMany(() => Product, (p) => p.category)
  products: Product[];
}
