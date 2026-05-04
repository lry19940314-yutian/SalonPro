// ============================================================================
// 美業 SaaS 智慧管理系統 — 服務項目實體
// ============================================================================
// 功能：對應 service_item 表，門店提供的各項美容服務
// ============================================================================

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceCategory } from './ServiceCategory';

@Entity('service_item')
export class ServiceItem {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '服務項目 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '所屬門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'category_id', nullable: true, comment: '分類 ID' })
  categoryId: number;

  @Column({ type: 'varchar', length: 100, comment: '服務名稱' })
  name: string;

  @Column({ type: 'int', comment: '服務時長（分鐘）' })
  duration: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '標準價格' })
  price: number;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '場務表顯示顏色' })
  color: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '服務描述' })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '服務圖片 URL' })
  image: string;

  @Column({ type: 'enum', enum: ['fixed', 'percent'], default: 'percent', comment: '抽成類型' })
  commissionType: 'fixed' | 'percent';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '抽成值' })
  commissionValue: number;

  @Column({ type: 'tinyint', default: 1, comment: '狀態：1=上架，0=下架' })
  status: number;

  @Column({ type: 'int', default: 0, comment: '排序序號' })
  sortOrder: number;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;

  // ========== 關聯 ==========

  @ManyToOne(() => ServiceCategory, (cat) => cat.serviceItems)
  @JoinColumn({ name: 'category_id' })
  category: ServiceCategory;
}
