// ============================================================================
// 美業 SaaS 智慧管理系統 — 系統配置服務
// ============================================================================
// 功能：系統配置管理、配置緩存
// ============================================================================

import { Provide } from '@midwayjs/core';
import { SystemConfigDAO } from '../dao/SystemConfigDAO';
import { SystemConfig } from '../entity/SystemConfig';
import { NotFoundError } from '../filter/exception';

@Provide()
export class SystemConfigService {
  constructor(
    private readonly systemConfigDAO: SystemConfigDAO
  ) {}

  /**
   * 根據 ID 查詢配置
   */
  async findById(id: number): Promise<SystemConfig> {
    const config = await this.systemConfigDAO.findById(id);
    if (!config) {
      throw new NotFoundError('系統配置不存在');
    }
    return config;
  }

  /**
   * 根據配置鍵查詢
   */
  async findByKey(configKey: string): Promise<SystemConfig | null> {
    return this.systemConfigDAO.findByKey(configKey);
  }

  /**
   * 根據鍵前綴查詢
   */
  async findByKeyPrefix(shopId: number, prefix: string): Promise<SystemConfig[]> {
    return this.systemConfigDAO.findByKeyPrefix(shopId, prefix);
  }

  /**
   * 獲取配置映射
   */
  async getConfigMap(shopId: number): Promise<Record<string, string>> {
    return this.systemConfigDAO.getConfigMap(shopId);
  }

  /**
   * 創建或更新配置
   */
  async upsert(data: {
    shopId: number;
    configKey: string;
    configValue: string;
    description?: string;
  }): Promise<SystemConfig> {
    return this.systemConfigDAO.upsert(data);
  }

  /**
   * 更新配置值
   */
  async updateValue(configKey: string, configValue: string): Promise<void> {
    await this.systemConfigDAO.updateValue(configKey, configValue);
  }

  /**
   * 批量設置配置
   */
  async setConfigs(shopId: number, configs: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(configs)) {
      await this.systemConfigDAO.upsert({ shopId, configKey: key, configValue: value });
    }
  }
}
