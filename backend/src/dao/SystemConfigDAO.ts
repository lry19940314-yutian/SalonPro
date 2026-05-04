// ============================================================================
// 美業 SaaS 智慧管理系統 — 系統配置 DAO
// ============================================================================
// 功能：系統配置表數據訪問層
// ============================================================================

import { Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { SystemConfig } from '../entity/SystemConfig';

@Provide()
export class SystemConfigDAO {
  @InjectDataSource()
  dataSource: DataSource;

  get entityManager() {
    return this.dataSource.manager;
  }

  /**
   * 根據 ID 查詢系統配置
   *
   * @param id - 配置 ID
   * @returns 系統配置實體或 null
   */
  async findById(id: number): Promise<SystemConfig | null> {
    return this.entityManager.findOne(SystemConfig, {
      where: { id },
    });
  }

  /**
   * 根據配置鍵查詢
   *
   * @param configKey - 配置鍵
   * @returns 系統配置實體或 null
   */
  async findByKey(configKey: string): Promise<SystemConfig | null> {
    return this.entityManager.findOne(SystemConfig, {
      where: { configKey },
    });
  }

  /**
   * 根據門店 ID 查詢所有配置
   *
   * @param shopId - 門店 ID
   * @returns 系統配置列表
   */
  async findByShopId(shopId: number): Promise<SystemConfig[]> {
    return this.entityManager.find(SystemConfig, {
      where: { shopId },
    });
  }

  /**
   * 根據配置鍵前綴查詢
   *
   * @param shopId - 門店 ID
   * @param keyPrefix - 配置鍵前綴
   * @returns 系統配置列表
   */
  async findByKeyPrefix(shopId: number, keyPrefix: string): Promise<SystemConfig[]> {
    return this.entityManager
      .createQueryBuilder(SystemConfig, 'config')
      .where('config.shopId = :shopId', { shopId })
      .andWhere('config.configKey LIKE :keyPrefix', { keyPrefix: `${keyPrefix}%` })
      .getMany();
  }

  /**
   * 創建或更新配置
   *
   * @param config - 系統配置實體
   * @returns 創建或更新後的系統配置
   */
  async upsert(config: Partial<SystemConfig>): Promise<SystemConfig> {
    const existing = await this.findByKey(config.configKey!);
    if (existing) {
      await this.entityManager.update(SystemConfig, existing.id, {
        configValue: config.configValue,
        description: config.description,
      } as any);
      return this.findById(existing.id) as Promise<SystemConfig>;
    }
    const entity = this.entityManager.create(SystemConfig, config);
    return this.entityManager.save(entity);
  }

  /**
   * 更新配置值
   *
   * @param configKey - 配置鍵
   * @param configValue - 配置值
   */
  async updateValue(configKey: string, configValue: string): Promise<void> {
    await this.entityManager
      .createQueryBuilder()
      .update(SystemConfig)
      .set({ configValue })
      .where('configKey = :configKey', { configKey })
      .execute();
  }

  /**
   * 刪除配置
   *
   * @param id - 配置 ID
   */
  async delete(id: number): Promise<void> {
    await this.entityManager.delete(SystemConfig, id);
  }

  /**
   * 批量獲取配置（以鍵值對形式返回）
   *
   * @param shopId - 門店 ID
   * @returns 配置鍵值對
   */
  async getConfigMap(shopId: number): Promise<Record<string, string>> {
    const configs = await this.findByShopId(shopId);
    const map: Record<string, string> = {};
    for (const config of configs) {
      map[config.configKey] = config.configValue;
    }
    return map;
  }
}
