// ============================================================================
// 美業 SaaS 智慧管理系統 — 產品實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ProductCategory } from './ProductCategory';

@Entity('product')
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '產品 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '所屬門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'category_id', nullable: true, comment: '分類 ID' })
  categoryId: number;

  @Column({ type: 'varchar', length: 100, comment: '產品名稱' })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '條碼' })
  barcode: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '品牌' })
  brand: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '規格' })
  specification: string;

  @Column({ type: 'varchar', length: 10, default: '個', comment: '單位' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '成本價' })
  costPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '售價' })
  sellingPrice: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '產品圖片 URL' })
  image: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '產品描述' })
  description: string;

  @Column({ type: 'enum', enum: ['fixed', 'percent'], default: 'percent', comment: '抽成類型' })
  commissionType: 'fixed' | 'percent';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '抽成值' })
  commissionValue: number;

  @Column({ type: 'tinyint', default: 1, comment: '狀態：1=上架，0=下架' })
  status: number;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;

  @ManyToOne(() => ProductCategory, (cat) => cat.products)
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;
}
