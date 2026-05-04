-- ============================================================================
-- 美業 SaaS 智慧管理系統 - 索引與外鍵約束
-- 版本: v1.0
-- 說明: 此腳本在 01-schema.sql 之後執行，用於補充索引與外鍵約束
-- ============================================================================

USE `salon_pro`;

-- ============================================================================
-- 外鍵約束（InnoDB 支援）
-- 注意：生產環境可視效能需求選擇是否啟用外鍵
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. 組織權限模組
-- --------------------------------------------------------------------------

ALTER TABLE `role_permission`
  ADD CONSTRAINT `fk_rp_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rp_permission_id` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `staff`
  ADD CONSTRAINT `fk_staff_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_staff_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `staff_shop`
  ADD CONSTRAINT `fk_ss_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ss_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------------------------
-- 2. 服務商品模組
-- --------------------------------------------------------------------------

ALTER TABLE `service_category`
  ADD CONSTRAINT `fk_sc_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `service_item`
  ADD CONSTRAINT `fk_si_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_si_category_id` FOREIGN KEY (`category_id`) REFERENCES `service_category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `product_category`
  ADD CONSTRAINT `fk_pc_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `product`
  ADD CONSTRAINT `fk_p_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_p_category_id` FOREIGN KEY (`category_id`) REFERENCES `product_category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------------------------
-- 3. 會員模組
-- --------------------------------------------------------------------------

ALTER TABLE `member`
  ADD CONSTRAINT `fk_member_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_member_level_id` FOREIGN KEY (`level_id`) REFERENCES `member_level` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `member_level`
  ADD CONSTRAINT `fk_ml_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `member_asset`
  ADD CONSTRAINT `fk_ma_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ma_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `member_asset_log`
  ADD CONSTRAINT `fk_mal_asset_id` FOREIGN KEY (`asset_id`) REFERENCES `member_asset` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mal_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mal_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mal_appointment_id` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mal_operator_id` FOREIGN KEY (`operator_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------------------------
-- 4. 票券模組
-- --------------------------------------------------------------------------

ALTER TABLE `coupon`
  ADD CONSTRAINT `fk_coupon_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `member_coupon`
  ADD CONSTRAINT `fk_mc_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mc_coupon_id` FOREIGN KEY (`coupon_id`) REFERENCES `coupon` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mc_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mc_appointment_id` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------------------------
-- 5. 場務模組
-- --------------------------------------------------------------------------

ALTER TABLE `schedule`
  ADD CONSTRAINT `fk_schedule_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_schedule_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_schedule_leave_id` FOREIGN KEY (`leave_id`) REFERENCES `leave` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `leave`
  ADD CONSTRAINT `fk_leave_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_leave_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_leave_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------------------------
-- 6. 預約模組
-- --------------------------------------------------------------------------

ALTER TABLE `appointment`
  ADD CONSTRAINT `fk_appt_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appt_member_id` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appt_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_appt_schedule_id` FOREIGN KEY (`schedule_id`) REFERENCES `schedule` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `appointment_item`
  ADD CONSTRAINT `fk_ai_appointment_id` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ai_service_id` FOREIGN KEY (`service_id`) REFERENCES `service_item` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ai_product_id` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ai_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `appointment_payment`
  ADD CONSTRAINT `fk_ap_appointment_id` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ap_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------------------------
-- 7. 業績模組
-- --------------------------------------------------------------------------

ALTER TABLE `performance`
  ADD CONSTRAINT `fk_perf_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_perf_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_perf_appointment_id` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_perf_appointment_item_id` FOREIGN KEY (`appointment_item_id`) REFERENCES `appointment_item` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `commission`
  ADD CONSTRAINT `fk_comm_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_comm_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_comm_performance_id` FOREIGN KEY (`performance_id`) REFERENCES `performance` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `commission_settlement`
  ADD CONSTRAINT `fk_cs_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cs_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cs_confirmed_by` FOREIGN KEY (`confirmed_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------------------------
-- 8. 庫存模組
-- --------------------------------------------------------------------------

ALTER TABLE `inventory`
  ADD CONSTRAINT `fk_inv_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inv_product_id` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `inventory_log`
  ADD CONSTRAINT `fk_il_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_il_product_id` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_il_inventory_id` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_il_operator_id` FOREIGN KEY (`operator_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `pick_order`
  ADD CONSTRAINT `fk_po_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_po_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_po_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `pick_item`
  ADD CONSTRAINT `fk_pi_pick_order_id` FOREIGN KEY (`pick_order_id`) REFERENCES `pick_order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pi_product_id` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pi_inventory_id` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------------------------
-- 9. 作品集模組
-- --------------------------------------------------------------------------

ALTER TABLE `portfolio`
  ADD CONSTRAINT `fk_portfolio_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_portfolio_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------------------------
-- 10. 通知模組
-- --------------------------------------------------------------------------

ALTER TABLE `notification`
  ADD CONSTRAINT `fk_notif_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notif_sender_id` FOREIGN KEY (`sender_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------------------------
-- 11. 系統日誌模組
-- --------------------------------------------------------------------------

ALTER TABLE `operation_log`
  ADD CONSTRAINT `fk_ol_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ol_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------------------------
-- 12. 系統配置模組
-- --------------------------------------------------------------------------

ALTER TABLE `system_config`
  ADD CONSTRAINT `fk_sc_shop_id` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- 補充索引（複合索引與全文索引）
-- ============================================================================

-- 預約查詢常用複合索引
CREATE INDEX `idx_appointment_shop_date` ON `appointment` (`shop_id`, `appointment_date`);
CREATE INDEX `idx_appointment_staff_date` ON `appointment` (`staff_id`, `appointment_date`);
CREATE INDEX `idx_appointment_member_date` ON `appointment` (`member_id`, `appointment_date`);

-- 場務表查詢常用複合索引
CREATE INDEX `idx_schedule_shop_date` ON `schedule` (`shop_id`, `date`);
CREATE INDEX `idx_schedule_staff_date_range` ON `schedule` (`staff_id`, `date`, `status`);

-- 業績統計常用複合索引
CREATE INDEX `idx_perf_shop_date` ON `performance` (`shop_id`, `performance_date`);
CREATE INDEX `idx_perf_staff_date` ON `performance` (`staff_id`, `performance_date`);
CREATE INDEX `idx_perf_staff_settled` ON `performance` (`staff_id`, `settled`);

-- 會員查詢複合索引
CREATE INDEX `idx_member_shop_level` ON `member` (`shop_id`, `level_id`);
CREATE INDEX `idx_member_shop_visit` ON `member` (`shop_id`, `last_visit`);

-- 庫存查詢複合索引
CREATE INDEX `idx_inv_shop_product` ON `inventory` (`shop_id`, `product_id`);
CREATE INDEX `idx_inv_shop_status` ON `inventory` (`shop_id`, `status`);

-- 通知查詢複合索引
CREATE INDEX `idx_notif_receiver_read` ON `notification` (`receiver_type`, `receiver_id`, `is_read`);

-- 操作日誌查詢複合索引
CREATE INDEX `idx_ol_shop_module` ON `operation_log` (`shop_id`, `module`);
CREATE INDEX `idx_ol_staff_action` ON `operation_log` (`staff_id`, `action`);
