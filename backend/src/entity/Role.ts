// ============================================================================
// 美業 SaaS 智慧管理系統 — 角色實體
// ============================================================================
// 功能：對應 role 表，系統角色定義（店長 / 美容師）
// ============================================================================

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Staff } from './Staff';
import { RolePermission } from './RolePermission';

/** 角色代碼枚舉 */
export enum RoleCode {
  /** 店長 / 管理員 */
  MANAGER = 'manager',
  /** 美容師 */
  BEAUTICIAN = 'beautician',
}

@Entity('role')
export class Role {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '角色 ID（主鍵）' })
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true, comment: '角色代碼（如 manager / beautician）' })
  code: string;

  @Column({ type: 'varchar', length: 50, comment: '角色名稱（如店長 / 美容師）' })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '角色描述' })
  description: string;

  @Column({ type: 'tinyint', default: 0, name: 'is_system', comment: '是否系統內建：1=是，0=自定義' })
  isSystem: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at', comment: '更新時間' })
  updatedAt: Date;

  // ========== 關聯 ==========

  @OneToMany(() => Staff, (staff) => staff.role)
  staffs: Staff[];

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];
}
