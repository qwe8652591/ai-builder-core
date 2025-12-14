// ⚠️ AUTO-GENERATED
// 生成时间：2025-12-10T19:25:28.730Z
// 
// 此文件统一导出所有 Schema（包括扩展）

// 本地模型 Schema
export * from '../../domain/PurchaseOrder.schema';
export * from '../../domain/Product.schema';

import type {
  PurchaseOrderItemTable,
  PurchaseOrderTable
} from '../../domain/PurchaseOrder.schema';
import type {
  ProductTable
} from '../../domain/Product.schema';

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
