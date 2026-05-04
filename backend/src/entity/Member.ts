// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('member')
export class Member {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '會員 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '所屬門店 ID' })
  shopId: number;

  @Column({ type: 'varchar', length: 30, unique: true, comment: '會員編號' })
  memberNo: string;

  @Column({ type: 'varchar', length: 50, comment: '會員姓名' })
  name: string;

  @Column({ type: 'varchar', length: 255, comment: '手機號碼（AES-256 加密）' })
  phone: string;

  @Column({ type: 'varchar', length: 64, name: 'phone_hash', comment: '手機號 SHA-256 雜湊' })
  phoneHash: string;

  @Column({ type: 'date', nullable: true, comment: '生日' })
  birthday: string;

  @Column({ type: 'tinyint', nullable: true, comment: '性別：0=未知，1=男，2=女' })
  gender: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '頭像 URL' })
  avatar: string;

  @Column({ type: 'bigint', name: 'level_id', nullable: true, comment: '會員等級 ID' })
  levelId: number;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '膚質' })
  skinType: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '過敏資訊' })
  allergyInfo: string;

  @Column({ type: 'json', nullable: true, comment: '偏好記錄' })
  preferences: Record<string, unknown>;

  @Column({ type: 'json', nullable: true, comment: '會員標籤' })
  tags: string[];

  @Column({ type: 'varchar', length: 30, nullable: true, comment: '來源渠道' })
  source: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, comment: '累計消費金額' })
  totalConsumption: number;

  @Column({ type: 'int', default: 0, comment: '到店次數' })
  visitCount: number;

  @Column({ type: 'datetime', nullable: true, comment: '最後到店時間' })
  lastVisit: Date;

  @Column({ type: 'tinyint', default: 1, comment: '狀態：1=正常，0=流失，2=黑名單' })
  status: number;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '備註' })
  remark: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
