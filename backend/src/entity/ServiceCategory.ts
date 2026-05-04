// ============================================================================
// 美業 SaaS 智慧管理系統 — 服務分類實體
// ============================================================================
// 功能：對應 service_category 表，服務項目分類
// ============================================================================

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ServiceItem } from './ServiceItem';

@Entity('service_category')
export class ServiceCategory {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '分類 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '所屬門店 ID' })
  shopId: number;

  @Column({ type: 'varchar', length: 50, comment: '分類名稱（如剪髮、染髮、護理）' })
  name: string;

  @Column({ type: 'int', default: 0, comment: '排序序號（數字越小越靠前）' })
  sortOrder: number;

  @Column({ type: 'tinyint', default: 1, comment: '狀態：1=啟用，0=停用' })
  status: number;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;

  // ========== 關聯 ==========

  @OneToMany(() => ServiceItem, (item) => item.category)
  serviceItems: ServiceItem[];
}
