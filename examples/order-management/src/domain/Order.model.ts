/**
 * 订单模型定义
 * 
 * 包含订单聚合根及相关实体
 */

import { Entity, Field, Composition, Association, Validation } from '@ai-builder/dsl';
import type { Decimal } from '@ai-builder/dsl';



/**
 * 客户实体
 */
@Entity()
export class Customer {
  @Field({ label: 'ID', type: 'string' })
  id?: string;

  @Field({ label: '客户名称', type: 'string' })
  @Validation({ required: true, minLength: 2, maxLength: 50 })
  name: string = '';

  @Field({ label: '邮箱', type: 'string' })
  @Validation({ required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
  email: string = '';

  @Field({ label: '电话', type: 'string' })
  phone?: string;

  @Field({ label: '信用额度', type: 'decimal' })
  creditLimit: Decimal = 0 as unknown as Decimal;

  @Field({ label: '创建时间', type: 'date' })
  createdAt?: Date;
}

/**
 * 产品实体
 */
@Entity()
export class Product {
  @Field({ label: 'ID', type: 'string' })
  id?: string;

  @Field({ label: '产品名称', type: 'string' })
  @Validation({ required: true })
  name: string = '';

  @Field({ label: '产品代码', type: 'string' })
  @Validation({ required: true, pattern: /^[A-Z0-9-]+$/ })
  code: string = '';

  @Field({ label: '单价', type: 'decimal' })
  @Validation({ required: true, min: 0 })
  price: Decimal = 0 as unknown as Decimal;

  @Field({ label: '库存数量', type: 'number' })
  @Validation({ required: true, min: 0 })
  stock: number = 0;

  @Field({ label: '是否启用', type: 'boolean' })
  active: boolean = true;
}

/**
 * 订单明细（组合关系）
 */
@Entity()
export class OrderLine {
  @Field({ label: 'ID', type: 'string' })
  id?: string;

  @Field({ label: '产品ID', type: 'string' })
  @Validation({ required: true })
  productId: string = '';

  @Association({ target: () => Product, type: 'ManyToOne' })
  product?: Product;

  @Field({ label: '数量', type: 'number' })
  @Validation({ required: true, min: 1 })
  quantity: number = 1;

  @Field({ label: '单价', type: 'decimal' })
  unitPrice: Decimal = 0 as unknown as Decimal;

  @Field({ label: '小计', type: 'decimal' })
  subtotal: Decimal = 0 as unknown as Decimal;
}

/**
 * 订单实体（聚合根）
 */
@Entity()
export class Order {
  @Field({ label: 'ID', type: 'string' })
  id?: string;

  @Field({ label: '订单号', type: 'string' })
  @Validation({ required: true, pattern: /^ORD-\d{8}-\d{4}$/ })
  orderNo: string = '';

  @Field({ label: '客户ID', type: 'string' })
  @Validation({ required: true })
  customerId: string = '';

  @Association({ target: () => Customer, type: 'ManyToOne' })
  customer?: Customer;

  @Composition({ target: () => OrderLine, type: 'OneToMany' })
  lines: OrderLine[] = [];

  @Field({ label: '订单状态', type: 'string' })
  @Validation({ 
    required: true
  })
  status: 'Draft' | 'Submitted' | 'Confirmed' | 'Shipped' | 'Completed' | 'Cancelled' = 'Draft';

  @Field({ label: '订单总额', type: 'decimal' })
  totalAmount: Decimal = 0 as unknown as Decimal;

  @Field({ label: '折扣金额', type: 'decimal' })
  discountAmount: Decimal = 0 as unknown as Decimal;

  @Field({ label: '实付金额', type: 'decimal' })
  finalAmount: Decimal = 0 as unknown as Decimal;

  @Field({ label: '下单时间', type: 'date' })
  orderedAt?: Date;

  @Field({ label: '备注', type: 'text' })
  remarks?: string;
}

