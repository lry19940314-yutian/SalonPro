// ============================================================================
// 美業 SaaS 智慧管理系統 — 權限實體
// ============================================================================
// 功能：對應 permission 表，系統功能權限定義
// ============================================================================

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { RolePermission } from './RolePermission';

@Entity('permission')
export class Permission {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '權限 ID（主鍵）' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true, comment: '權限代碼（如 schedule:view）' })
  code: string;

  @Column({ type: 'varchar', length: 100, comment: '權限名稱' })
  name: string;

  @Column({ type: 'varchar', length: 50, comment: '所屬模組（如 schedule / member / inventory）' })
  module: string;

  @Column({ type: 'varchar', length: 30, comment: '操作類型（view / create / edit / delete / approve）' })
  action: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '權限描述' })
  description: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  // ========== 關聯 ==========

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];
}
