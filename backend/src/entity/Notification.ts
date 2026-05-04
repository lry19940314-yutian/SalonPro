// ============================================================================
// 美業 SaaS 智慧管理系統 — 通知記錄實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '通知 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'enum', enum: ['appointment_reminder', 'appointment_completed', 'system_alert', 'marketing', 'leave_approval', 'pick_approval'], comment: '通知類型' })
  type: 'appointment_reminder' | 'appointment_completed' | 'system_alert' | 'marketing' | 'leave_approval' | 'pick_approval';

  @Column({ type: 'varchar', length: 200, comment: '通知標題' })
  title: string;

  @Column({ type: 'text', comment: '通知內容' })
  content: string;

  @Column({ type: 'bigint', nullable: true, comment: '發送人 ID' })
  senderId: number;

  @Column({ type: 'enum', enum: ['staff', 'member', 'all'], comment: '接收對象類型' })
  receiverType: 'staff' | 'member' | 'all';

  @Column({ type: 'bigint', nullable: true, comment: '接收對象 ID' })
  receiverId: number;

  @Column({ type: 'varchar', length: 30, nullable: true, comment: '關聯類型' })
  referenceType: string;

  @Column({ type: 'bigint', nullable: true, comment: '關聯業務 ID' })
  referenceId: number;

  @Column({ type: 'tinyint', default: 0, comment: '是否已讀：1=是，0=否' })
  isRead: number;

  @Column({ type: 'datetime', nullable: true, comment: '閱讀時間' })
  readAt: Date;

  @Column({ type: 'enum', enum: ['in_app', 'sms', 'push'], default: 'in_app', comment: '發送渠道' })
  channel: 'in_app' | 'sms' | 'push';

  @Column({ type: 'enum', enum: ['pending', 'sent', 'failed'], default: 'pending', comment: '發送狀態' })
  status: 'pending' | 'sent' | 'failed';

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;
}
