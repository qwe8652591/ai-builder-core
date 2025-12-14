/**
 * 采购订单领域模型 - 装饰器版本
 * 
 * 🎯 使用装饰器语法定义领域模型
 * 类定义时自动注册到 Metadata Store
 * 类本身就是 TypeScript 类型，无需额外定义
 */

import { 
  Entity, 
  ValueObject, 
  Column, 
  PrimaryKey, 
  OneToMany, 
  OneToOne,
  FieldTypes,
  CascadeTypes,
  defineTypedEnum,
} from '@qwe8652591/dsl-core';

// ==================== 枚举定义 ====================

/**
 * 采购订单状态
 * 
 * 🎯 使用 defineTypedEnum 一体化定义枚举值和标签
 * 
 * @example
 * PurchaseOrderStatus.DRAFT              // 'DRAFT' - 枚举值
 * PurchaseOrderStatus.getLabel('DRAFT')  // '草稿' - 获取标签
 * PurchaseOrderStatus.getOptions()       // [{ value: 'DRAFT', label: '草稿' }, ...]
 */
export const PurchaseOrderStatus = defineTypedEnum({
  name: 'PurchaseOrderStatus',
  comment: '采购订单状态',
  values: {
    DRAFT: '草稿',
    PENDING: '待审批',
    APPROVED: '已审批',
    IN_PROGRESS: '执行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  },
});

// 从枚举推导类型（供内部使用）
type PurchaseOrderStatusType = keyof typeof PurchaseOrderStatus.values;

// ==================== 值对象 ====================

/**
 * 供应商信息（值对象）
 */
@ValueObject({ comment: '供应商信息' })
export class SupplierInfo {
  @Column({ type: FieldTypes.STRING, label: '供应商编码', required: true })
  code!: string;

  @Column({ type: FieldTypes.STRING, label: '供应商名称', required: true })
  name!: string;

  @Column({ type: FieldTypes.STRING, label: '联系人' })
  contactPerson?: string;

  @Column({ type: FieldTypes.STRING, label: '联系电话' })
  contactPhone?: string;

  @Column({ type: FieldTypes.STRING, label: '地址' })
  address?: string;
}

/**
 * 采购订单明细项（值对象）
 */
@ValueObject({ comment: '采购订单明细' })
export class PurchaseOrderItem {
  @Column({ type: FieldTypes.STRING, label: '明细ID' })
  id?: string;

  @Column({ type: FieldTypes.STRING, label: '物料编码', required: true })
  materialCode!: string;

  @Column({ type: FieldTypes.STRING, label: '物料名称' })
  materialName?: string;

  @Column({ type: FieldTypes.STRING, label: '规格型号' })
  specification?: string;

  @Column({ type: FieldTypes.NUMBER, label: '采购数量', required: true })
  quantity!: number;

  @Column({ type: FieldTypes.STRING, label: '单位' })
  unit?: string;

  @Column({ type: FieldTypes.NUMBER, label: '单价', required: true })
  unitPrice!: number;

  @Column({ type: FieldTypes.DATE, label: '需求日期' })
  requiredDate?: Date;

  @Column({ type: FieldTypes.STRING, label: '备注' })
  remark?: string;
}

// ==================== 实体 ====================

/**
 * 采购订单（聚合根）
 * 
 * ✅ 类定义自动注册到 Metadata Store
 * ✅ 类本身就是 TypeScript 类型
 */
@Entity({ 
  table: 'purchase_orders', 
  comment: '采购订单',
  // 🎯 使用元数据扩展的属性
  audit: true,           // 启用审计
  softDelete: true,      // 软删除
  versioned: true,       // 乐观锁
})
export class PurchaseOrder {
  @PrimaryKey()
  @Column({ type: FieldTypes.STRING, label: '订单ID', hidden: true })
  id!: string;

  @Column({ 
    type: FieldTypes.STRING, 
    label: '订单编号', 
    required: true,
    validation: { pattern: /^PO\d{8}$/, message: '订单编号格式错误' },
    // 🎯 使用元数据扩展的属性
    sortable: true,
    searchable: true,
    width: 150,
    order: 1,
  })
  orderNo!: string;

  @Column({ 
    type: FieldTypes.STRING, 
    label: '订单标题', 
    required: true,
    validation: { minLength: 1, maxLength: 200, message: '标题不能超过200字符' },
    // 🎯 使用元数据扩展的属性
    searchable: true,
    placeholder: '请输入订单标题',
    order: 2,
  })
  title!: string;

  @OneToOne(() => SupplierInfo, true)  // embedded = true
  supplier!: SupplierInfo;

  @OneToMany(() => PurchaseOrderItem, [CascadeTypes.INSERT, CascadeTypes.UPDATE, CascadeTypes.REMOVE])
  items!: PurchaseOrderItem[];

  @Column({ 
    type: FieldTypes.NUMBER, 
    label: '订单总额', 
    required: true,
    // 🎯 使用元数据扩展的属性
    displayFormat: 'currency',
    sortable: true,
    align: 'right',
    width: 120,
    permission: 'finance:view',  // 只有财务人员可见
    order: 5,
  })
  totalAmount!: number;

  @Column({ type: FieldTypes.STRING, label: '订单状态' })
  status?: PurchaseOrderStatusType;

  @Column({ type: FieldTypes.STRING, label: '创建人' })
  createdBy?: string;

  @Column({ type: FieldTypes.DATETIME, label: '创建时间' })
  createdAt?: Date;

  @Column({ type: FieldTypes.STRING, label: '审批人' })
  approvedBy?: string;

  @Column({ type: FieldTypes.DATETIME, label: '审批时间' })
  approvedAt?: Date;

  @Column({ type: FieldTypes.STRING, label: '审批意见' })
  approvalComment?: string;

  @Column({ type: FieldTypes.STRING, label: '备注' })
  remark?: string;

  @Column({ type: FieldTypes.DATETIME, label: '更新时间' })
  updatedAt?: Date;
}
