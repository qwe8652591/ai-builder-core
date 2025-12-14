/**
 * Product 领域模型 Schema
 * 
 * ⚠️ 此文件由领域模型自动生成，请勿手动编辑
 * 生成时间：2025/12/12 09:33:22
 * 源文件：Product.model.ts
 * 
 * 包含的实体：Product
 */

import { Generated, ColumnType } from 'kysely';
import type { ProductPriority, ProductStatus } from '../src/domain/Product.model';

// ==================== Product 相关 ====================

/**
 * 产品表 表
 */
export interface ProductTable {
  id: Generated<string>;  // 产品ID
  product_code: string;  // 产品编码
  product_name: string;  // 产品名称
  category: string;  // 产品分类
  supplier_code: string | null;  // 供应商编码
  unit_price: ColumnType<number, string | number, string | number>;  // 单价
  stock_quantity: ColumnType<number, string | number, string | number>;  // 库存数量
  priority: ProductPriority;  // 优先级
  status: ProductStatus;  // 状态
  remark: string | null;  // 备注
  created_at: Generated<Date>;  // 创建时间
  updated_at: Generated<Date>;  // 更新时间
}

