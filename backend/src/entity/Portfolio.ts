// ============================================================================
// 美業 SaaS 智慧管理系統 — 作品集實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('portfolio')
export class Portfolio {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '作品 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'staff_id', comment: '美容師 ID' })
  staffId: number;

  @Column({ type: 'enum', enum: ['image', 'video'], default: 'image', comment: '媒體類型' })
  mediaType: 'image' | 'video';

  @Column({ type: 'varchar', length: 255, comment: '媒體檔案 URL' })
  url: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '縮圖 URL' })
  thumbnailUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '作品標題' })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '作品描述' })
  description: string;

  @Column({ type: 'json', nullable: true, comment: '關聯服務項目 ID' })
  serviceIds: number[];

  @Column({ type: 'int', default: 0, comment: '排序序號' })
  sortOrder: number;

  @Column({ type: 'tinyint', default: 1, comment: '狀態：1=展示，0=隱藏' })
  status: number;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
