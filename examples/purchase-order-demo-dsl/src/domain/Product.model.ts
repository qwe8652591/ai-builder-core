/**
 * 产品领域模型示例
 * 
 * 此文件演示如何定义领域模型，然后通过 pnpm gen:kysely 自动生成 Kysely Schema
 */

import { Entity, Field, Decimal } from '@ai-builder/dsl';

/**
 * 产品状态枚举
 */
export enum ProductStatus {
  ACTIVE = 'ACTIVE',       // 在售
  INACTIVE = 'INACTIVE',   // 停售
  ARCHIVED = 'ARCHIVED',   // 已归档
}

/**
 * 产品优先级枚举
 */
export enum ProductPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * 产品实体
 * 
 * 定义后运行 `pnpm gen:kysely` 将自动生成对应的 Kysely Schema
 */
@Entity({ table: 'products', comment: '产品表' })
export class Product {
  @Field({ label: '产品ID' })
  id!: string;

  @Field({ label: '产品编码' })
  productCode!: string;  // → 数据库: product_code

  @Field({ label: '产品名称' })
  productName!: string;  // → 数据库: product_name

  @Field({ label: '产品分类' })
  category!: string;

  @Field({ label: '供应商编码' })
  supplierCode?: string;  // → 数据库: supplier_code (可选字段 → | null)

  @Field({ label: '单价' })
  unitPrice!: Decimal;  // → 数据库: unit_price (ColumnType<number, string | number, string | number>)

  @Field({ label: '库存数量' })
  stockQuantity!: Decimal;  // → 数据库: stock_quantity

  @Field({ label: '优先级' })
  priority!: ProductPriority;  // → 数据库: priority ('LOW' | 'MEDIUM' | 'HIGH')

  @Field({ label: '状态' })
  status!: ProductStatus;  // → 数据库: status ('ACTIVE' | 'INACTIVE' | 'ARCHIVED')

  @Field({ label: '备注' })
  remark?: string;

  @Field({ label: '创建时间' })
  createdAt!: Date;  // → 数据库: created_at (Generated<Date>)

  @Field({ label: '更新时间' })
  updatedAt!: Date;  // → 数据库: updated_at (Generated<Date>)
}

/**
 * 使用说明：
 * 
 * 1. 定义好领域模型后，运行：
 *    pnpm gen:kysely
 * 
 * 2. 将自动生成：
 *    src/infrastructure/database/kysely-schema-generated.ts
 * 
 * 3. 生成的 Schema 包含：
 *    - 字段名自动转换（productCode → product_code）
 *    - 类型自动映射（Decimal → ColumnType）
 *    - 可选字段处理（? → | null）
 *    - 自动生成字段（createdAt → Generated<Date>）
 * 
 * 4. 在 Repository 中使用生成的 Schema，获得完整的类型安全
 */

