// ============================================================================
// 美業 SaaS 智慧管理系統 — Redis 模塊使用示例
// ============================================================================
// 功能：展示 CacheService / LockService / CacheGuardService 的實際業務用法
// ============================================================================

import { Provide, Inject } from '@midwayjs/core';
import { CacheService } from './cache.service';
import { LockService } from './lock.service';
import { CacheGuardService } from './guard.service';
import { AppointmentCacheKey, MemberCacheKey, PerformanceCacheKey, ConfigCacheKey } from './types';

/**
 * ============================================================================
 * 示例 1：預約服務 — 展示緩存 + 分布式鎖的典型用法
 * ============================================================================
 */
@Provide()
export class AppointmentExampleService {
  @Inject()
  private cacheService: CacheService;

  @Inject()
  private lockService: LockService;

  /**
   * 創建預約（含分布式鎖防重複預約）
   *
   * 業務場景：美容師小美在 2026-05-04 的 10:00-11:00 時段被預約
   * 分布式鎖確保同一時段不會被重複預約
   */
  async createAppointment(
    beauticianId: number,
    memberId: number,
    date: string,
    timeSlot: string,
    serviceItemId: number,
  ): Promise<{ success: boolean; message: string; appointmentId?: number }> {
    // 1. 獲取分布式鎖（防止重複預約）
    const lockResult = await this.lockService.acquireAppointmentLock(
      beauticianId,
      date,
      timeSlot,
    );

    if (!lockResult.success) {
      return {
        success: false,
        message: `該時段已被預約，請選擇其他時間`,
      };
    }

    try {
      // 2. 檢查美容師排班（此處模擬 DB 查詢）
      const isAvailable = await this.checkBeauticianSchedule(beauticianId, date, timeSlot);
      if (!isAvailable) {
        return {
          success: false,
          message: `美容師該時段不可用`,
        };
      }

      // 3. 檢查會員是否有重複預約（此處模擬 DB 查詢）
      const hasDuplicate = await this.checkMemberDuplicateAppointment(
        memberId,
        date,
        timeSlot,
      );
      if (hasDuplicate) {
        return {
          success: false,
          message: `您在同一時段已有預約`,
        };
      }

      // 4. 創建預約記錄（此處模擬 DB 插入）
      const appointmentId = await this.saveAppointment(
        beauticianId,
        memberId,
        date,
        timeSlot,
        serviceItemId,
      );

      // 5. 失效相關緩存
      await this.cacheService.delByPattern(`${AppointmentCacheKey.TODAY_LIST}${beauticianId}:${date}`);
      await this.cacheService.delByPattern(`${AppointmentCacheKey.LIST}${memberId}`);

      return {
        success: true,
        message: `預約成功`,
        appointmentId,
      };
    } finally {
      // 6. 釋放鎖
      await this.lockService.releaseLock(lockResult.key, lockResult.value);
    }
  }

  /**
   * 獲取預約詳情（含緩存穿透防護）
   */
  async getAppointmentDetail(appointmentId: number): Promise<Record<string, unknown> | null> {
    const cacheKey = `${AppointmentCacheKey.DETAIL}${appointmentId}`;

    return this.cacheService.remember(
      cacheKey,
      async () => {
        // 模擬 DB 查詢
        return this.queryAppointmentFromDb(appointmentId);
      },
      {
        ttl: 300, // 5 分鐘
        useBloomFilter: true,
        useMutex: true,
        prefix: 'appt:detail:',
      },
    ).then(result => result.data);
  }

  /**
   * 獲取今日預約列表（短時緩存）
   */
  async getTodayAppointments(beauticianId: number, date: string): Promise<unknown[]> {
    const cacheKey = `${AppointmentCacheKey.TODAY_LIST}${beauticianId}:${date}`;

    return this.cacheService.remember(
      cacheKey,
      async () => {
        // 模擬 DB 查詢
        return this.queryTodayAppointmentsFromDb(beauticianId, date);
      },
      {
        ttl: 60, // 1 分鐘，今日預約變動頻繁
        useMutex: true,
      },
    ).then(result => result.data);
  }

  // -------- 模擬 DB 方法 --------

  private async checkBeauticianSchedule(
    _beauticianId: number,
    _date: string,
    _timeSlot: string,
  ): Promise<boolean> {
    // TODO: 查詢 schedule 表
    return true;
  }

  private async checkMemberDuplicateAppointment(
    _memberId: number,
    _date: string,
    _timeSlot: string,
  ): Promise<boolean> {
    // TODO: 查詢 appointment 表
    return false;
  }

  private async saveAppointment(
    _beauticianId: number,
    _memberId: number,
    _date: string,
    _timeSlot: string,
    _serviceItemId: number,
  ): Promise<number> {
    // TODO: INSERT INTO appointment ...
    return 10001;
  }

  private async queryAppointmentFromDb(
    _appointmentId: number,
  ): Promise<Record<string, unknown> | null> {
    // TODO: SELECT * FROM appointment WHERE id = ?
    return {
      id: _appointmentId,
      memberName: '張小姐',
      beauticianName: '小美',
      serviceName: '深層清潔護理',
      date: '2026-05-04',
      timeSlot: '10:00-11:00',
      status: 'confirmed',
    };
  }

  private async queryTodayAppointmentsFromDb(
    _beauticianId: number,
    _date: string,
  ): Promise<unknown[]> {
    // TODO: SELECT * FROM appointment WHERE beautician_id = ? AND date = ?
    return [
      { id: 10001, timeSlot: '10:00-11:00', memberName: '張小姐', status: 'confirmed' },
      { id: 10002, timeSlot: '14:00-15:00', memberName: '李太太', status: 'pending' },
    ];
  }
}

/**
 * ============================================================================
 * 示例 2：會員服務 — 展示緩存分級策略
 * ============================================================================
 */
@Provide()
export class MemberExampleService {
  @Inject()
  private cacheService: CacheService;

  @Inject()
  private lockService: LockService;

  /**
   * 獲取會員資料（10 分鐘緩存）
   */
  async getMemberProfile(memberId: number): Promise<Record<string, unknown> | null> {
    const cacheKey = `${MemberCacheKey.PROFILE}${memberId}`;

    return this.cacheService.remember(
      cacheKey,
      async () => {
        // TODO: SELECT * FROM member WHERE id = ?
        return {
          id: memberId,
          name: '張小姐',
          phone: '0912***456',
          level: '金卡會員',
          points: 2500,
        };
      },
      { ttl: 600, useMutex: true },
    ).then(result => result.data);
  }

  /**
   * 會員消費扣款（含分布式鎖防並發）
   */
  async deductMemberBalance(
    memberId: number,
    amount: number,
  ): Promise<{ success: boolean; balance: number }> {
    // 使用分布式鎖防止並發扣款
    const result = await this.lockService.withLock(
      `mbr:asset:${memberId}`,
      async () => {
        // 1. 查詢當前餘額（此處模擬）
        const currentBalance = await this.getMemberBalance(memberId);

        // 2. 檢查餘額是否充足
        if (currentBalance < amount) {
          return { success: false, balance: currentBalance };
        }

        // 3. 扣款（此處模擬 DB 更新）
        const newBalance = currentBalance - amount;
        await this.updateMemberBalance(memberId, newBalance);

        // 4. 失效緩存
        await this.cacheService.del(`${MemberCacheKey.ASSET}${memberId}`);

        return { success: true, balance: newBalance };
      },
      { timeout: 3000, maxRetries: 5 },
    );
    return result ?? { success: false, balance: 0 };
  }

  private async getMemberBalance(_memberId: number): Promise<number> {
    // TODO: SELECT balance FROM member_asset WHERE member_id = ?
    return 5000;
  }

  private async updateMemberBalance(_memberId: number, _newBalance: number): Promise<void> {
    // TODO: UPDATE member_asset SET balance = ? WHERE member_id = ?
  }
}

/**
 * ============================================================================
 * 示例 3：庫存服務 — 展示分布式鎖防超賣
 * ============================================================================
 */
@Provide()
export class InventoryExampleService {
  @Inject()
  private lockService: LockService;

  /**
   * 領料出庫（含分布式鎖防超賣）
   *
   * 業務場景：美容師領取產品，需要扣減庫存
   * 分布式鎖確保同一產品的庫存扣減是線性化的
   */
  async pickProduct(
    productId: number,
    quantity: number,
    batchNo: string,
  ): Promise<{ success: boolean; message: string }> {
    // 使用分布式鎖防止庫存超賣
    const result = await this.lockService.withLock(
      `inv:pick:${productId}:${batchNo}`,
      async () => {
        // 1. 查詢當前庫存（此處模擬）
        const currentStock = await this.getCurrentStock(productId, batchNo);

        // 2. 檢查庫存是否充足
        if (currentStock < quantity) {
          return {
            success: false,
            message: `庫存不足，當前庫存: ${currentStock}，需求: ${quantity}`,
          };
        }

        // 3. 扣減庫存（此處模擬 DB 更新）
        await this.deductStock(productId, batchNo, quantity);

        // 4. 記錄領料明細（此處模擬 DB 插入）
        await this.createPickRecord(productId, quantity, batchNo);

        return {
          success: true,
          message: `領料成功，已扣減庫存 ${quantity}`,
        };
      },
      { timeout: 3000, maxRetries: 20, retryInterval: 100 },
    );
    return result ?? { success: false, message: '系統繁忙，請稍後重試' };
  }

  private async getCurrentStock(_productId: number, _batchNo: string): Promise<number> {
    // TODO: SELECT quantity FROM inventory WHERE product_id = ? AND batch_no = ?
    return 100;
  }

  private async deductStock(
    _productId: number,
    _batchNo: string,
    _quantity: number,
  ): Promise<void> {
    // TODO: UPDATE inventory SET quantity = quantity - ? WHERE product_id = ? AND batch_no = ?
  }

  private async createPickRecord(
    _productId: number,
    _quantity: number,
    _batchNo: string,
  ): Promise<void> {
    // TODO: INSERT INTO pick_item ...
  }
}

/**
 * ============================================================================
 * 示例 4：業績統計 — 展示緩存分級 + 後台刷新
 * ============================================================================
 */
@Provide()
export class PerformanceExampleService {
  @Inject()
  private cacheService: CacheService;

  @Inject()
  private lockService: LockService;

  /**
   * 獲取美容師月業績統計（30 分鐘緩存）
   */
  async getMonthlyPerformance(
    beauticianId: number,
    yearMonth: string,
  ): Promise<Record<string, unknown>> {
    const cacheKey = `${PerformanceCacheKey.MONTHLY}${beauticianId}:${yearMonth}`;

    return this.cacheService.remember(
      cacheKey,
      async () => {
        // TODO: 聚合查詢 performance 表
        return {
          beauticianId,
          yearMonth,
          totalAmount: 85000,
          serviceCount: 45,
          commissionAmount: 21250,
          rank: 3,
        };
      },
      { ttl: 1800, useMutex: true }, // 30 分鐘緩存
    ).then(result => result.data);
  }

  /**
   * 業績結算（含分布式鎖防重複結算）
   */
  async settlePerformance(
    shopId: number,
    settleDate: string,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.lockService.withLock(
      `perf:settle:${shopId}:${settleDate}`,
      async () => {
        // 1. 檢查是否已結算
        const isSettled = await this.checkSettled(shopId, settleDate);
        if (isSettled) {
          return { success: false, message: '該日期已結算，請勿重複操作' };
        }

        // 2. 執行結算邏輯（此處模擬）
        await this.executeSettlement(shopId, settleDate);

        // 3. 失效相關緩存
        await this.cacheService.delByPattern(`${PerformanceCacheKey.MONTHLY}*`);
        await this.cacheService.delByPattern(`${PerformanceCacheKey.DAILY}*`);

        return { success: true, message: '結算成功' };
      },
      { timeout: 10000, maxRetries: 3 },
    );
    return result ?? { success: false, message: '系統繁忙，請稍後重試' };
  }

  private async checkSettled(_shopId: number, _settleDate: string): Promise<boolean> {
    // TODO: SELECT COUNT(*) FROM commission_settlement WHERE shop_id = ? AND settle_date = ?
    return false;
  }

  private async executeSettlement(_shopId: number, _settleDate: string): Promise<void> {
    // TODO: 結算事務邏輯
  }
}

/**
 * ============================================================================
 * 示例 5：配置服務 — 展示長時間緩存 + 布隆過濾器
 * ============================================================================
 */
@Provide()
export class ConfigExampleService {
  @Inject()
  private cacheService: CacheService;

  @Inject()
  private cacheGuardService: CacheGuardService;

  /**
   * 獲取門店配置（1 小時緩存）
   */
  async getShopConfig(shopId: number): Promise<Record<string, unknown>> {
    const cacheKey = `${ConfigCacheKey.SHOP}${shopId}`;

    return this.cacheService.remember(
      cacheKey,
      async () => {
        // TODO: SELECT * FROM system_config WHERE shop_id = ?
        return {
          shopId,
          businessHours: { start: '09:00', end: '21:00' },
          commissionRate: 0.25,
          appointmentInterval: 30,
          maxAdvanceDays: 30,
        };
      },
      { ttl: 3600 }, // 1 小時緩存
    ).then(result => result.data);
  }

  /**
   * 更新門店配置（更新後主動失效緩存）
   */
  async updateShopConfig(
    shopId: number,
    config: Record<string, unknown>,
  ): Promise<void> {
    // 1. 更新 DB（此處模擬）
    console.log(`[Config] 更新門店 ${shopId} 配置:`, config);

    // 2. 失效緩存
    await this.cacheService.del(`${ConfigCacheKey.SHOP}${shopId}`);

    // 3. 通知其他服務實例緩存失效（通過 Redis Pub/Sub）
    await this.notifyConfigChange(shopId);
  }

  private async notifyConfigChange(shopId: number): Promise<void> {
    // TODO: 通過 Redis 發布/訂閱通知其他實例
    console.log(`[Config] 通知配置變更: shopId=${shopId}`);
  }
}
