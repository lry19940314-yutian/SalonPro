// ============================================================================
// 美業 SaaS 智慧管理系統 — 門店實體
// ============================================================================
// 功能：對應 shop 表，SaaS 多租戶核心
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

@Entity('shop')
export class Shop {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '門店 ID（主鍵）' })
  id: number;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'code', comment: '客戶代碼（登錄用，唯一標識）' })
  code: string;

  @Column({ type: 'varchar', length: 100, name: 'name', comment: '門店名稱' })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone', comment: '聯繫電話' })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'address', comment: '門店地址' })
  address: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'logo', comment: '門店 Logo URL' })
  logo: string;

  @Column({ type: 'tinyint', default: 1, name: 'status', comment: '狀態：1=啟用，0=停用' })
  status: number;

  @Column({ type: 'json', nullable: true, name: 'business_hours', comment: '營業時間配置（JSON 格式）' })
  businessHours: Record<string, unknown>;

  @Column({ type: 'json', nullable: true, name: 'commission_rules', comment: '抽成規則配置（JSON 格式）' })
  commissionRules: Record<string, unknown>;

  @CreateDateColumn({ type: 'datetime', name: 'created_at', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at', comment: '更新時間' })
  updatedAt: Date;

  // ========== 關聯 ==========

  @OneToMany(() => Staff, (staff) => staff.shop)
  staffs: Staff[];
}
