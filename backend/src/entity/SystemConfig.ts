// ============================================================================
// 美業 SaaS 智慧管理系統 — 系統配置實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('system_config')
export class SystemConfig {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '配置 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'varchar', length: 100, comment: '配置鍵名' })
  configKey: string;

  @Column({ type: 'text', comment: '配置值' })
  configValue: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '配置說明' })
  description: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
