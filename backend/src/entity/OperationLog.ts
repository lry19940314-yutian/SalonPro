// ============================================================================
// 美業 SaaS 智慧管理系統 — 操作日誌實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('operation_log')
export class OperationLog {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '日誌 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', nullable: true, comment: '操作人員 ID' })
  staffId: number;

  @Column({ type: 'varchar', length: 50, comment: '操作模組' })
  module: string;

  @Column({ type: 'varchar', length: 50, comment: '操作動作' })
  action: string;

  @Column({ type: 'varchar', length: 30, nullable: true, comment: '操作對象類型' })
  targetType: string;

  @Column({ type: 'bigint', nullable: true, comment: '操作對象 ID' })
  targetId: number;

  @Column({ type: 'json', nullable: true, comment: '操作詳情' })
  detail: Record<string, unknown>;

  @Column({ type: 'varchar', length: 45, nullable: true, comment: '操作 IP' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '用戶代理' })
  userAgent: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;
}
