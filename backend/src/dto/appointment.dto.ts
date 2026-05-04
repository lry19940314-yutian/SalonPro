// ============================================================================
// 美業 SaaS 智慧管理系統 — 預約 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 預約項目明細 DTO
 */
export class AppointmentItemDTO {
  @Rule(
    RuleType.string()
      .required()
      .valid('service', 'product')
      .messages({
        'string.empty': '項目類型不可為空',
        'any.only': '項目類型必須為 service 或 product',
        'any.required': '項目類型為必填項',
      })
  )
  itemType: 'service' | 'product';

  @Rule(RuleType.number().integer().positive().optional())
  serviceId?: number;

  @Rule(RuleType.number().integer().positive().optional())
  productId?: number;

  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(100)
      .messages({
        'string.empty': '項目名稱不可為空',
        'string.min': '項目名稱長度至少為 1 個字元',
        'string.max': '項目名稱長度不可超過 100 個字元',
        'any.required': '項目名稱為必填項',
      })
  )
  name: string;

  @Rule(RuleType.number().integer().min(1).optional())
  quantity?: number;

  @Rule(
    RuleType.number()
      .required()
      .min(0)
      .messages({
        'number.base': '單價必須為數字',
        'number.min': '單價不可為負數',
        'any.required': '單價為必填項',
      })
  )
  unitPrice: number;

  @Rule(RuleType.number().integer().min(1).optional())
  duration?: number;

  @Rule(RuleType.number().integer().positive().optional())
  staffId?: number;

  @Rule(RuleType.number().integer().min(0).optional())
  sortOrder?: number;
}

/**
 * 創建預約 DTO
 */
export class CreateAppointmentDTO {
  @Rule(
    RuleType.number()
      .required()
      .integer()
      .positive()
      .messages({
        'number.base': '會員 ID 必須為數字',
        'number.integer': '會員 ID 必須為整數',
        'number.positive': '會員 ID 必須為正數',
        'any.required': '會員 ID 為必填項',
      })
  )
  memberId: number;

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

  @Rule(RuleType.number().integer().positive().optional())
  scheduleId?: number;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .messages({
        'string.empty': '預約日期不可為空',
        'string.pattern.base': '日期格式必須為 YYYY-MM-DD',
        'any.required': '預約日期為必填項',
      })
  )
  appointmentDate: string;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{2}:\d{2}(:\d{2})?$/)
      .messages({
        'string.empty': '開始時間不可為空',
        'string.pattern.base': '開始時間格式必須為 HH:mm 或 HH:mm:ss',
        'any.required': '開始時間為必填項',
      })
  )
  startTime: string;

  @Rule(
    RuleType.string()
      .required()
      .pattern(/^\d{2}:\d{2}(:\d{2})?$/)
      .messages({
        'string.empty': '結束時間不可為空',
        'string.pattern.base': '結束時間格式必須為 HH:mm 或 HH:mm:ss',
        'any.required': '結束時間為必填項',
      })
  )
  endTime: string;

  @Rule(RuleType.string().max(500).optional())
  remark?: string;

  @Rule(
    RuleType.array()
      .required()
      .items(RuleType.object().required())
      .min(1)
      .messages({
        'array.base': '預約項目列表必須為陣列',
        'array.min': '至少需要一個預約項目',
        'any.required': '預約項目列表為必填項',
      })
  )
  items: AppointmentItemDTO[];
}

/**
 * 更新預約 DTO
 */
export class UpdateAppointmentDTO {
  @Rule(RuleType.number().integer().positive().optional())
  memberId?: number;

  @Rule(RuleType.number().integer().positive().optional())
  staffId?: number;

  @Rule(RuleType.number().integer().positive().optional())
  scheduleId?: number;

  @Rule(RuleType.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional())
  appointmentDate?: string;

  @Rule(RuleType.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional())
  startTime?: string;

  @Rule(RuleType.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).optional())
  endTime?: string;

  @Rule(RuleType.string().max(500).optional())
  remark?: string;
}

/**
 * 取消預約 DTO
 */
export class CancelAppointmentDTO {
  @Rule(RuleType.string().max(255).optional())
  reason?: string;
}

/**
 * 預約支付 DTO
 */
export class AppointmentPaymentDTO {
  @Rule(
    RuleType.string()
      .required()
      .min(1)
      .max(20)
      .messages({
        'string.empty': '支付方式不可為空',
        'string.min': '支付方式長度至少為 1 個字元',
        'string.max': '支付方式長度不可超過 20 個字元',
        'any.required': '支付方式為必填項',
      })
  )
  paymentMethod: string;

  @Rule(
    RuleType.number()
      .required()
      .min(0)
      .messages({
        'number.base': '支付金額必須為數字',
        'number.min': '支付金額不可為負數',
        'any.required': '支付金額為必填項',
      })
  )
  amount: number;

  @Rule(RuleType.string().max(255).optional())
  remark?: string;
}
