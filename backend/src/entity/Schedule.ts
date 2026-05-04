// ============================================================================
// 美業 SaaS 智慧管理系統 — 場務表（美容師排班）實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('schedule')
export class Schedule {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '場務 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'bigint', name: 'staff_id', comment: '美容師 ID' })
  staffId: number;

  @Column({ type: 'date', comment: '日期' })
  date: string;

  @Column({ type: 'time', comment: '上班時間' })
  startTime: string;

  @Column({ type: 'time', comment: '下班時間' })
  endTime: string;

  @Column({ type: 'time', nullable: true, comment: '休息開始時間' })
  breakStart: string;

  @Column({ type: 'time', nullable: true, comment: '休息結束時間' })
  breakEnd: string;

  @Column({ type: 'tinyint', default: 0, comment: '是否公休/請假：1=是，0=否' })
  isOff: number;

  @Column({ type: 'bigint', nullable: true, comment: '關聯請假單 ID' })
  leaveId: number;

  @Column({ type: 'enum', enum: ['available', 'busy', 'off'], default: 'available', comment: '時段狀態' })
  status: 'available' | 'busy' | 'off';

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '備註' })
  remark: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', comment: '更新時間' })
  updatedAt: Date;
}
