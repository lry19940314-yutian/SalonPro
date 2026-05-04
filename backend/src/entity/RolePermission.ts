// ============================================================================
// 美業 SaaS 智慧管理系統 — 角色權限關聯實體
// ============================================================================
// 功能：對應 role_permission 表，角色與權限多對多關係
// ============================================================================

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './Role';
import { Permission } from './Permission';

@Entity('role_permission')
export class RolePermission {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '關聯 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'role_id', comment: '角色 ID' })
  roleId: number;

  @Column({ type: 'bigint', name: 'permission_id', comment: '權限 ID' })
  permissionId: number;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  // ========== 關聯 ==========

  @ManyToOne(() => Role, (role) => role.rolePermissions)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions)
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
