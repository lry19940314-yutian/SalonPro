// ============================================================================
// 美業 SaaS 智慧管理系統 — 員工實體
// ============================================================================
// 功能：對應 staff 表，門店員工（美容師 / 店長），密碼 bcrypt 加密存儲
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
import { Shop } from './Shop';
import { Role } from './Role';

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '員工 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '所屬門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'role_id', comment: '角色 ID' })
  roleId: number;

  @Column({ type: 'varchar', length: 50, unique: true, comment: '登錄帳號（唯一）' })
  username: string;

  @Column({ type: 'varchar', length: 255, comment: '密碼（bcrypt 加密）' })
  password: string;

  @Column({ type: 'varchar', length: 50, comment: '姓名' })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '手機號碼' })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '電子郵件' })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '頭像 URL' })
  avatar: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '職稱（如資深美容師）' })
  title: string;

  @Column({ type: 'json', nullable: true, comment: '專長標籤（JSON 陣列）' })
  specialties: string[];

  @Column({ type: 'date', nullable: true, comment: '入職日期' })
  hireDate: string;

  @Column({ type: 'tinyint', default: 1, comment: '狀態：1=在職，0=離職' })
  status: number;

  @Column({ type: 'datetime', nullable: true, comment: '最後登錄時間' })
  lastLogin: Date;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;

  // ========== 關聯 ==========

  @ManyToOne(() => Shop, (shop) => shop.staffs)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToOne(() => Role, (role) => role.staffs)
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
