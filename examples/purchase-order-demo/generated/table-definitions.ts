/**
 * 表结构定义（运行态使用）
 * 
 * ⚠️ 此文件由领域模型自动生成，请勿手动编辑
 * 生成时间：2025/12/12 09:33:22
 * 
 * 用于浏览器端 sql.js 动态创建表结构
 */

export interface ColumnDefinition {
  name: string;
  /** Kysely/SQLite 类型：'text' | 'real' | 'integer' | 'blob' */
  type: 'text' | 'real' | 'integer' | 'blob';
  primaryKey?: boolean;
  notNull?: boolean;
  unique?: boolean;
  defaultValue?: string | number | boolean | null;
  /** 外键引用的表.字段 */
  references?: string;
  comment?: string;
}

export interface TableDefinition {
  name: string;
  comment?: string;
  columns: ColumnDefinition[];
}

export const tableDefinitions: TableDefinition[] = [
  {
    name: 'purchase_order_items',
    comment: '采购订单明细表',
    columns: [
      { name: 'id', type: 'text', primaryKey: true, comment: '明细ID' },
      { name: 'material_code', type: 'text', notNull: true, comment: '物料编码' },
      { name: 'material_name', type: 'text', notNull: true, comment: '物料名称' },
      { name: 'specification', type: 'text', comment: '规格型号' },
      { name: 'quantity', type: 'real', notNull: true, comment: '采购数量' },
      { name: 'unit', type: 'text', notNull: true, comment: '单位' },
      { name: 'unit_price', type: 'real', notNull: true, comment: '单价' },
      { name: 'required_date', type: 'text', notNull: true, comment: '需求日期' },
      { name: 'remark', type: 'text', comment: '备注' },
      { name: 'purchase_order_id', type: 'text', notNull: true, references: 'purchase_orders.id', comment: '外键，指向 purchase_orders.id' },
      { name: 'created_at', type: 'text', notNull: true, comment: '创建时间' },
      { name: 'updated_at', type: 'text', notNull: true, comment: '更新时间' },
    ],
  },
  {
    name: 'supplier_infos',
    comment: '供应商信息表',
    columns: [
      { name: 'code', type: 'text', notNull: true, comment: '供应商编码' },
      { name: 'name', type: 'text', notNull: true, comment: '供应商名称' },
      { name: 'contact_person', type: 'text', comment: '联系人' },
      { name: 'contact_phone', type: 'text', comment: '联系电话' },
      { name: 'address', type: 'text', comment: '地址' },
      { name: 'created_at', type: 'text', notNull: true, comment: '创建时间' },
      { name: 'updated_at', type: 'text', notNull: true, comment: '更新时间' },
    ],
  },
  {
    name: 'purchase_orders',
    comment: '采购订单表',
    columns: [
      { name: 'internal_approval_status', type: 'text', comment: '内部审批状态' },
      { name: 'approver_employee_no', type: 'text', comment: '审批人工号' },
      { name: 'custom_remark', type: 'text', comment: '自定义备注' },
      { name: 'custom_tags', type: 'text', comment: '扩展标签' },
      { name: 'id', type: 'text', primaryKey: true, comment: '订单ID' },
      { name: 'order_no', type: 'text', notNull: true, comment: '订单编号' },
      { name: 'title', type: 'text', notNull: true, comment: '订单标题' },
      { name: 'supplier_code', type: 'text', notNull: true, comment: '供应商编码' },
      { name: 'supplier_name', type: 'text', notNull: true, comment: '供应商名称' },
      { name: 'supplier_contact_person', type: 'text', comment: '联系人' },
      { name: 'supplier_contact_phone', type: 'text', comment: '联系电话' },
      { name: 'supplier_address', type: 'text', comment: '地址' },
      { name: 'total_amount', type: 'real', notNull: true, comment: '订单总额' },
      { name: 'status', type: 'text', notNull: true, comment: '订单状态' },
      { name: 'created_by', type: 'text', notNull: true, comment: '创建人' },
      { name: 'created_at', type: 'text', notNull: true, comment: '创建时间' },
      { name: 'approved_by', type: 'text', comment: '审批人' },
      { name: 'approved_at', type: 'text', comment: '审批时间' },
      { name: 'approval_comment', type: 'text', comment: '审批意见' },
      { name: 'remark', type: 'text', comment: '备注' },
      { name: 'updated_at', type: 'text', notNull: true, comment: '更新时间' },
    ],
  },
  {
    name: 'products',
    comment: '产品表',
    columns: [
      { name: 'id', type: 'text', primaryKey: true, comment: '产品ID' },
      { name: 'product_code', type: 'text', notNull: true, comment: '产品编码' },
      { name: 'product_name', type: 'text', notNull: true, comment: '产品名称' },
      { name: 'category', type: 'text', notNull: true, comment: '产品分类' },
      { name: 'supplier_code', type: 'text', comment: '供应商编码' },
      { name: 'unit_price', type: 'real', notNull: true, comment: '单价' },
      { name: 'stock_quantity', type: 'real', notNull: true, comment: '库存数量' },
      { name: 'priority', type: 'text', notNull: true, comment: '优先级' },
      { name: 'status', type: 'text', notNull: true, comment: '状态' },
      { name: 'remark', type: 'text', comment: '备注' },
      { name: 'created_at', type: 'text', notNull: true, comment: '创建时间' },
      { name: 'updated_at', type: 'text', notNull: true, comment: '更新时间' },
    ],
  },
];
