// ⚠️ AUTO-GENERATED
// 生成时间：2025-12-12T01:33:22.347Z
// 
// 此文件统一导出所有 Schema（包括扩展）

// 本地模型 Schema
export * from './PurchaseOrder.schema';
export * from './Product.schema';

import type {
  PurchaseOrderItemTable,
  PurchaseOrderTable
} from './PurchaseOrder.schema';
import type {
  ProductTable
} from './Product.schema';

/**
 * 数据库 Schema
 * 
 * 包含所有表的类型定义（包括扩展字段）
 */
export interface Database {
  purchase_order_items: PurchaseOrderItemTable;
  purchase_orders: PurchaseOrderTable;
  products: ProductTable;
}
