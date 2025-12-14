/**
 * 采购订单领域模型
 * 
 * 定义采购订单的业务对象模型
 */

import { Entity, Field, Decimal, Validation, Composition, RelationType, CascadeType } from '@ai-builder/dsl';

/**
 * 采购订单状态枚举
 */
export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',           // 草稿
  PENDING = 'PENDING',       // 待审批
  APPROVED = 'APPROVED',     // 已审批
  IN_PROGRESS = 'IN_PROGRESS', // 执行中
  COMPLETED = 'COMPLETED',   // 已完成
  CANCELLED = 'CANCELLED',   // 已取消
}

/**
 * 采购订单明细项（值对象）
 */
@Entity({ table: 'purchase_order_items', comment: '采购订单明细表' })
export class PurchaseOrderItem {
  @Field({ label: '明细ID' })
  id!: string;

  @Field({ label: '物料编码' })
  @Validation({ 
    required: true,
    message: '物料编码不能为空'
  })
  materialCode!: string;

  @Field({ label: '物料名称' })
  materialName!: string;

  @Field({ label: '规格型号' })
  specification?: string;

  @Field({ label: '采购数量' })
  @Validation({ 
    required: true,
    min: 0,
    message: '采购数量必须大于0'
  })
  quantity!: Decimal;

  @Field({ label: '单位' })
  unit!: string;

  @Field({ label: '单价' })
  @Validation({ 
    required: true,
    min: 0,
    message: '单价必须大于0'
  })
  unitPrice!: Decimal;

  @Field({ label: '需求日期' })
  requiredDate!: Date;

  @Field({ label: '备注' })
  remark?: string;
}

/**
 * 供应商信息（值对象）
 */
@Entity({ table: 'supplier_infos', comment: '供应商信息表' })
export class SupplierInfo {
  @Field({ label: '供应商编码' })
  @Validation({ 
    required: true,
    message: '供应商编码不能为空'
  })
  code!: string;

  @Field({ label: '供应商名称' })
  @Validation({ 
    required: true,
    message: '供应商名称不能为空'
  })
  name!: string;

  @Field({ label: '联系人' })
  contactPerson?: string;

  @Field({ label: '联系电话' })
  contactPhone?: string;

  @Field({ label: '地址' })
  address?: string;
}

/**
 * 采购订单（业务对象）
 */
@Entity({ table: 'purchase_orders', comment: '采购订单表' })
export class PurchaseOrder {
  @Field({ label: '订单ID' })
  id!: string;

  @Field({ label: '订单编号' })
  @Validation({ 
    required: true,
    pattern: /^PO\d{8}$/,
    message: '订单编号格式错误，应为 PO + 8位数字'
  })
  orderNo!: string;

  @Field({ label: '订单标题' })
  @Validation({ 
    required: true,
    minLength: 1,
    maxLength: 200,
    message: '订单标题不能为空，且长度不能超过200个字符'
  })
  title!: string;

  @Field({ label: '供应商信息' })
  @Composition({
    type: RelationType.OneToOne,
    embedded: true  // 值对象，扁平化到主表
  })
  supplier!: SupplierInfo;

  @Field({ label: '订单明细' })
  @Composition({
    type: RelationType.OneToMany,
    cascade: [CascadeType.Insert, CascadeType.Update, CascadeType.Remove]  // 级联所有操作
  })
  @Validation({ 
    required: true,
    custom: (items: PurchaseOrderItem[]) => items && items.length > 0 ? true : '订单明细不能为空',
    message: '订单明细不能为空'
  })
  items!: PurchaseOrderItem[];

  @Field({ label: '订单总额' })
  @Validation({ 
    required: true,
    min: 0,
    message: '订单总额必须大于0'
  })
  totalAmount!: Decimal;

  @Field({ label: '订单状态' })
  status!: PurchaseOrderStatus;

  @Field({ label: '创建人' })
  createdBy!: string;

  @Field({ label: '创建时间' })
  createdAt!: Date;

  @Field({ label: '审批人' })
  approvedBy?: string;

  @Field({ label: '审批时间' })
  approvedAt?: Date;

  @Field({ label: '审批意见' })
  approvalComment?: string;

  @Field({ label: '备注' })
  remark?: string;

  @Field({ label: '更新时间' })
  updatedAt?: Date;
}

