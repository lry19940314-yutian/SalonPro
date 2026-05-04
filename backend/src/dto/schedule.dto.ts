// ============================================================================
// 美業 SaaS 智慧管理系統 — 場務（排班）DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建排班 DTO
 */
export class CreateScheduleDTO {
  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .messages({
        'number.base': '美容師 ID 必須為數字',
        'number.integer': '美容師 ID 必須為整數',
        'number.positive': '美容師 ID 必須為正數',
        'any.required': '美容師 ID 為必填項',
      })
  )
  staffId: number;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .messages({
        'string.empty': '日期不可為空',
        'string.pattern.base': '日期格式必須為 YYYY-MM-DD',
        'any.required': '日期為必填項',
      })
  )
  date: string;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{2}:\d{2}(:\d{2})?$/)
      .messages({
        'string.empty': '上班時間不可為空',
        'string.pattern.base': '上班時間格式必須為 HH:mm 或 HH:mm:ss',
        'any.required': '上班時間為必填項',
      })
  )
  startTime: string;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{2}:\d{2}(:\d{2})?$/)
      .messages({
        'string.empty': '下班時間不可為空',
        'string.pattern.base': '下班時間格式必須為 HH:mm 或 HH:mm:ss',
        'any.required': '下班時間為必填項',
      })
  )
  endTime: string;

  @Rule(RuleType.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional())
  breakStart?: string;

  @Rule(RuleType.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional())
  breakEnd?: string;

  @Rule(RuleType.number().valid(0, 1).optional())
  isOff?: number;

  @Rule(RuleType.string().valid('available', 'busy', 'off').optional())
  status?: 'available' | 'busy' | 'off';

  @Rule(RuleType.string().max(255).optional())
  remark?: string;
}

/**
 * 批量創建排班 DTO
 */
export class BatchCreateScheduleDTO {
  @Rule(
    RuleType.array()
      .required()
      .items(RuleType.object().required())
      .min(1)
      .max(100)
      .messages({
        'array.base': '排班列表必須為陣列',
        'array.min': '至少需要一個排班記錄',
        'array.max': '單次最多建立 100 個排班記錄',
        'any.required': '排班列表為必填項',
      })
  )
  schedules: CreateScheduleDTO[];
}

/**
 * 更新排班 DTO
 */
export class UpdateScheduleDTO {
  @Rule(RuleType.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional())
  startTime?: string;

  @Rule(RuleType.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional())
  endTime?: string;

  @Rule(RuleType.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional())
  breakStart?: string;

  @Rule(RuleType.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional())
  breakEnd?: string;

  @Rule(RuleType.number().valid(0, 1).optional())
  isOff?: number;

  @Rule(RuleType.string().valid('available', 'busy', 'off').optional())
  status?: 'available' | 'busy' | 'off';

  @Rule(RuleType.string().max(255).optional())
  remark?: string;
}
