// ============================================================================
// 美業 SaaS 智慧管理系統 — 通知 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建通知 DTO
 */
export class CreateNotificationDTO {
  @Rule(
    RuleType.string()
      .required()
      .valid('staff', 'member', 'all')
      .messages({
        'string.empty': '接收者類型不可為空',
        'any.only': '接收者類型必須為 staff、member 或 all',
        'any.required': '接收者類型為必填項',
      })
  )
  receiverType: 'staff' | 'member' | 'all';

  @Rule(RuleType.number().integer().positive().optional())
  receiverId?: number;

  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(100)
      .messages({
        'string.empty': '通知標題不可為空',
        'string.min': '通知標題長度至少為 1 個字元',
        'string.max': '通知標題長度不可超過 100 個字元',
        'any.required': '通知標題為必填項',
      })
  )
  title: string;

  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(2000)
      .messages({
        'string.empty': '通知內容不可為空',
        'string.min': '通知內容長度至少為 1 個字元',
        'string.max': '通知內容長度不可超過 2000 個字元',
        'any.required': '通知內容為必填項',
      })
  )
  content: string;

  @Rule(RuleType.string().max(50).optional())
  type?: string;

  @Rule(RuleType.object().optional())
  extraData?: Record<string, unknown>;
}

/**
 * 批量創建通知 DTO
 */
export class BatchCreateNotificationDTO {
  @Rule(
    RuleType.array()
      .required()
      .items(RuleType.object().required())
      .min(1)
      .max(50)
      .messages({
        'array.base': '通知列表必須為陣列',
        'array.min': '至少需要一個通知',
        'array.max': '單次最多建立 50 個通知',
        'any.required': '通知列表為必填項',
      })
  )
  notifications: CreateNotificationDTO[];
}

/**
 * 更新通知狀態 DTO
 */
export class UpdateNotificationStatusDTO {
  @Rule(
    RuleType.string()
      .required()
      .valid('pending', 'sent', 'failed')
      .messages({
        'string.empty': '通知狀態不可為空',
        'any.only': '通知狀態必須為 pending、sent 或 failed',
        'any.required': '通知狀態為必填項',
      })
  )
  status: 'pending' | 'sent' | 'failed';
}
