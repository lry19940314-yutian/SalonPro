// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員持有優惠券實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('member_coupon')
export class MemberCoupon {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '記錄 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'member_id', comment: '會員 ID' })
  memberId: number;

  @Column({ type: 'bigint', name: 'coupon_id', comment: '優惠券 ID' })
  couponId: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'varchar', length: 30, unique: true, comment: '優惠券兌換碼' })
  code: string;

  @Column({ type: 'enum', enum: ['unused', 'used', 'expired'], default: 'unused', comment: '狀態' })
  status: 'unused' | 'used' | 'expired';

  @Column({ type: 'datetime', nullable: true, comment: '使用時間' })
  usedAt: Date;

  @Column({ type: 'bigint', nullable: true, comment: '使用預約 ID' })
  appointmentId: number;

  @Column({ type: 'date', comment: '到期日期' })
  expiryDate: string;

  @CreateDateColumn({ type: 'datetime', comment: '領取時間' })
  createdAt: Date;
}
