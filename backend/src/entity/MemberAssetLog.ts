// ============================================================================
// 美業 SaaS 智慧管理系統 — 會員資產變動日誌實體
// ============================================================================

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('member_asset_log')
export class MemberAssetLog {
  @PrimaryGeneratedColumn({ type: 'bigint', comment: '日誌 ID（主鍵）' })
  id: number;

  @Column({ type: 'bigint', name: 'asset_id', comment: '資產 ID' })
  assetId: number;

  @Column({ type: 'bigint', name: 'member_id', comment: '會員 ID' })
  memberId: number;

  @Column({ type: 'bigint', name: 'shop_id', comment: '門店 ID' })
  shopId: number;

  @Column({ type: 'enum', enum: ['recharge', 'consume', 'refund', 'expire', 'bonus', 'deduct'], comment: '變動類型' })
  changeType: 'recharge' | 'consume' | 'refund' | 'expire' | 'bonus' | 'deduct';

  @Column({ type: 'int', comment: '變動數量' })
  quantityChange: number;

  @Column({ type: 'int', comment: '變動後餘額' })
  balanceAfter: number;

  @Column({ type: 'bigint', nullable: true, comment: '關聯預約 ID' })
  appointmentId: number;

  @Column({ type: 'bigint', nullable: true, comment: '操作人員 ID' })
  operatorId: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '備註' })
  remark: string;

  @CreateDateColumn({ type: 'datetime', comment: '創建時間' })
  createdAt: Date;
}
