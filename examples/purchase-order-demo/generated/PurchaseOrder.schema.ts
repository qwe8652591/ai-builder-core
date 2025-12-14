/**
 * PurchaseOrder 领域模型 Schema
 * 
 * ⚠️ 此文件由领域模型自动生成，请勿手动编辑
 * 生成时间：2025/12/12 09:33:22
 * 源文件：PurchaseOrder.model.ts
 * 
 * 包含的实体：PurchaseOrderItem, PurchaseOrder
 */

import { Generated, ColumnType } from 'kysely';
import type { PurchaseOrderStatus } from '../src/domain/PurchaseOrder.model';

// ==================== PurchaseOrder 相关 ====================

/**
 * 采购订单明细表 表
 */
export interface PurchaseOrderItemTable {
  id: Generated<string>;  // 明细ID
  material_code: string;  // 物料编码
  material_name: string;  // 物料名称
  specification: string | null;  // 规格型号
  quantity: ColumnType<number, string | number, string | number>;  // 采购数量
  unit: string;  // 单位
  unit_price: ColumnType<number, string | number, string | number>;  // 单价
  required_date: Date;  // 需求日期
  remark: string | null;  // 备注
  purchase_order_id: string;  // 外键，指向 purchase_orders.id
  created_at: Generated<Date>;  // 创建时间
  updated_at: Generated<Date>;  // 更新时间
}

/**
 * 采购订单表 表
 */
export interface PurchaseOrderTable {
  internal_approval_status: string | null;  // 内部审批状态
  approver_employee_no: string | null;  // 审批人工号
  custom_remark: string | null;  // 自定义备注
  custom_tags: string | null;  // 扩展标签
  id: Generated<string>;  // 订单ID
  order_no: string;  // 订单编号
  title: string;  // 订单标题
  supplier_code: string;  // 供应商编码
  supplier_name: string;  // 供应商名称
  supplier_contact_person: string | null;  // 联系人
  supplier_contact_phone: string | null;  // 联系电话
  supplier_address: string | null;  // 地址
  total_amount: ColumnType<number, string | number, string | number>;  // 订单总额
  status: PurchaseOrderStatus;  // 订单状态
  created_by: string;  // 创建人
  created_at: Generated<Date>;  // 创建时间
  approved_by: string | null;  // 审批人
  approved_at: Date | null;  // 审批时间
  approval_comment: string | null;  // 审批意见
  remark: string | null;  // 备注
  updated_at: Generated<Date>;  // 更新时间
}

