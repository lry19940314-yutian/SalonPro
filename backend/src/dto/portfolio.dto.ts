// ============================================================================
// 美業 SaaS 智慧管理系統 — 作品集 DTO
// ============================================================================

import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 創建作品 DTO
 */
export class CreatePortfolioDTO {
  @Rule(
    RuleType.string()
      .required()
      .valid('image', 'video')
      .messages({
        'string.empty': '媒體類型不可為空',
        'any.only': '媒體類型必須為 image 或 video',
        'any.required': '媒體類型為必填項',
      })
  )
  mediaType: 'image' | 'video';

  @Rule(
    RuleType.string()
      .required()
      .max(255)
      .messages({
        'string.empty': '媒體檔案 URL 不可為空',
        'string.max': '媒體檔案 URL 長度不可超過 255 個字元',
        'any.required': '媒體檔案 URL 為必填項',
      })
  )
  url: string;

  @Rule(RuleType.string().max(255).optional())
  thumbnailUrl?: string;

  @Rule(RuleType.string().max(100).optional())
  title?: string;

  @Rule(RuleType.string().max(500).optional())
  description?: string;

  @Rule(RuleType.array().items(RuleType.number().integer().positive()).optional())
  serviceIds?: number[];

  @Rule(RuleType.number().integer().min(0).optional())
  sortOrder?: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;
}

/**
 * 更新作品 DTO
 */
export class UpdatePortfolioDTO {
  @Rule(RuleType.string().valid('image', 'video').optional())
  mediaType?: 'image' | 'video';

  @Rule(RuleType.string().max(255).optional())
  url?: string;

  @Rule(RuleType.string().max(255).optional())
  thumbnailUrl?: string;

  @Rule(RuleType.string().max(100).optional())
  title?: string;

  @Rule(RuleType.string().max(500).optional())
  description?: string;

  @Rule(RuleType.array().items(RuleType.number().integer().positive()).optional())
  serviceIds?: number[];

  @Rule(RuleType.number().integer().min(0).optional())
  sortOrder?: number;

  @Rule(RuleType.number().valid(0, 1).optional())
  status?: number;
}
