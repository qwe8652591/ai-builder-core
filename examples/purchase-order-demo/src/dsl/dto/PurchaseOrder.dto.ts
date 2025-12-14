/**
 * 采购订单 DTO - 装饰器版本
 * 
 * 🎯 通过类继承复用 Model 字段定义
 * ✅ 类定义时自动注册到 Metadata Store
 * ✅ 类本身就是 TypeScript 类型
 */

import { 
  DTO,
  Field,
  FieldTypes,
} from '@ai-builder/jsx-runtime';
import { 
  PurchaseOrder,
  PurchaseOrderItem as PurchaseOrderItemModel,
  SupplierInfo as SupplierInfoModel,
  PurchaseOrderStatus,
} from '../models/PurchaseOrder.model';

// 从 defineTypedEnum 获取类型
type PurchaseOrderStatusType = keyof typeof PurchaseOrderStatus.values;

// ==================== View 层可用的派生 DTO ====================
// View 层只能从 DTO 层获取类型，通过派生方式复用 Model 定义

/**
 * 供应商信息 DTO（View 层可用）
 * 
 * 🎯 派生自 SupplierInfo Model
 */
@DTO({ comment: '供应商信息' })
export class SupplierInfoDTO extends SupplierInfoModel {}

/**
 * 订单明细项 DTO（View 层可用）
 * 
 * 🎯 派生自 PurchaseOrderItem Model
 */
@DTO({ comment: '订单明细项' })
export class PurchaseOrderItemDTO extends PurchaseOrderItemModel {
  /** 计算字段：金额 = 数量 × 单价 */
  @Field({ type: FieldTypes.NUMBER, label: '金额' })
  amount?: number;
}

// ==================== 基础 DTO ====================

/**
 * 简单订单操作 DTO（仅需 id）
 * 
 * 🎯 继承自 PurchaseOrder，只使用 id 字段
 */
@DTO({ comment: '简单订单操作' })
export class SimplePurchaseOrderDTO implements Pick<PurchaseOrder, 'id'> {
  @Field({ type: FieldTypes.STRING, label: '订单ID', required: true })
  id!: string;
}

/**
 * 审批通过 DTO
 * 
 * 🎯 继承 SimplePurchaseOrderDTO，扩展审批字段
 */
@DTO({ comment: '审批通过' })
export class ApprovePurchaseOrderDTO extends SimplePurchaseOrderDTO {
  @Field({ type: FieldTypes.STRING, label: '审批人', required: true })
  approvedBy!: string;

  @Field({ type: FieldTypes.STRING, label: '审批意见' })
  comment?: string;
}

/**
 * 审批拒绝 DTO
 * 
 * 🎯 继承 SimplePurchaseOrderDTO，扩展拒绝原因
 */
@DTO({ comment: '审批拒绝' })
export class RejectPurchaseOrderDTO extends SimplePurchaseOrderDTO {
  @Field({ type: FieldTypes.STRING, label: '审批人', required: true })
  approvedBy!: string;

  @Field({ type: FieldTypes.STRING, label: '拒绝原因', required: true })
  comment!: string;
}

/**
 * 取消订单 DTO
 */
@DTO({ comment: '取消订单' })
export class CancelPurchaseOrderDTO extends SimplePurchaseOrderDTO {
  @Field({ type: FieldTypes.STRING, label: '取消原因' })
  reason?: string;
}

// ==================== 查询 DTO ====================

/**
 * 查询订单列表 DTO
 * 
 * 🎯 实现 Partial<Pick<PurchaseOrder, ...>> 复用字段类型
 */
@DTO({ comment: '查询订单列表', pagination: true })
export class GetPurchaseOrderListDTO implements Partial<Pick<PurchaseOrder, 'status' | 'orderNo' | 'createdBy'>> {
  @Field({ type: FieldTypes.STRING, label: '订单状态' })
  status?: PurchaseOrderStatusType;

  @Field({ type: FieldTypes.STRING, label: '订单编号' })
  orderNo?: string;

  @Field({ type: FieldTypes.STRING, label: '供应商名称' })
  supplierName?: string;

  @Field({ type: FieldTypes.STRING, label: '创建人' })
  createdBy?: string;

  @Field({ type: FieldTypes.DATE, label: '开始日期' })
  startDate?: Date;

  @Field({ type: FieldTypes.DATE, label: '结束日期' })
  endDate?: Date;
}

/**
 * 查询待审批订单 DTO
 */
@DTO({ comment: '查询待审批订单', pagination: true })
export class GetPendingPurchaseOrdersDTO {}

/**
 * 查询我的订单 DTO
 */
@DTO({ comment: '查询我的订单', pagination: true })
export class GetMyPurchaseOrdersDTO implements Partial<Pick<PurchaseOrder, 'status'>> {
  @Field({ type: FieldTypes.STRING, label: '用户ID', required: true })
  userId!: string;

  @Field({ type: FieldTypes.STRING, label: '订单状态' })
  status?: PurchaseOrderStatusType;
}

/**
 * 按状态统计订单 DTO
 */
@DTO({ comment: '按状态统计订单' })
export class CountPurchaseOrdersByStatusDTO {
  @Field({ type: FieldTypes.STRING, label: '用户ID' })
  userId?: string;
}

/**
 * 订单统计结果 DTO
 */
@DTO({ comment: '订单统计' })
export class PurchaseOrderStatisticsDTO {
  @Field({ type: FieldTypes.NUMBER, label: '草稿数', required: true })
  draft!: number;

  @Field({ type: FieldTypes.NUMBER, label: '待审批数', required: true })
  pending!: number;

  @Field({ type: FieldTypes.NUMBER, label: '已审批数', required: true })
  approved!: number;

  @Field({ type: FieldTypes.NUMBER, label: '执行中数', required: true })
  inProgress!: number;

  @Field({ type: FieldTypes.NUMBER, label: '已完成数', required: true })
  completed!: number;

  @Field({ type: FieldTypes.NUMBER, label: '已取消数', required: true })
  cancelled!: number;

  @Field({ type: FieldTypes.NUMBER, label: '总数', required: true })
  total!: number;
}

// ==================== 选项 DTO ====================

/**
 * 供应商选项 DTO
 * 
 * 🎯 继承 SupplierInfo 的部分字段
 */
@DTO({ comment: '供应商选项' })
export class SupplierOptionDTO implements Pick<SupplierInfoModel, 'code' | 'name' | 'contactPerson' | 'contactPhone'> {
  @Field({ type: FieldTypes.STRING, label: '供应商编码', required: true })
  code!: string;

  @Field({ type: FieldTypes.STRING, label: '供应商名称', required: true })
  name!: string;

  @Field({ type: FieldTypes.STRING, label: '联系人' })
  contactPerson?: string;

  @Field({ type: FieldTypes.STRING, label: '联系电话' })
  contactPhone?: string;
}

/**
 * 物料选项 DTO
 * 
 * 🎯 继承 PurchaseOrderItem 的部分字段
 */
@DTO({ comment: '物料选项' })
export class MaterialOptionDTO implements Pick<PurchaseOrderItemModel, 'materialCode' | 'materialName' | 'unit'> {
  @Field({ type: FieldTypes.STRING, label: '物料编码', required: true })
  materialCode!: string;

  @Field({ type: FieldTypes.STRING, label: '物料名称', required: true })
  materialName?: string;

  @Field({ type: FieldTypes.STRING, label: '规格型号' })
  specification?: string;

  @Field({ type: FieldTypes.STRING, label: '单位', required: true })
  unit?: string;

  @Field({ type: FieldTypes.NUMBER, label: '最新价格' })
  latestPrice?: number;
}

// ==================== CRUD DTO ====================

/**
 * 创建采购订单 DTO
 * 
 * 🎯 继承 PurchaseOrder，排除自动生成的字段
 */
@DTO({ comment: '创建采购订单' })
export class CreatePurchaseOrderDTO implements Omit<PurchaseOrder, 
  'id' | 'orderNo' | 'totalAmount' | 'status' | 'createdAt' | 'updatedAt' | 'approvedBy' | 'approvedAt' | 'approvalComment'
> {
  @Field({ type: FieldTypes.STRING, label: '订单标题', required: true })
  title!: string;

  @Field({ type: FieldTypes.COMPOSITION, label: '供应商信息', required: true })
  supplier!: SupplierInfoModel;

  @Field({ type: FieldTypes.COMPOSITION, label: '订单明细', required: true })
  items!: PurchaseOrderItemModel[];

  @Field({ type: FieldTypes.STRING, label: '创建人', required: true })
  createdBy!: string;

  @Field({ type: FieldTypes.STRING, label: '备注' })
  remark?: string;
}

/**
 * 更新采购订单 DTO
 * 
 * 🎯 id 必填，其他字段可选
 */
@DTO({ comment: '更新采购订单' })
export class UpdatePurchaseOrderDTO extends SimplePurchaseOrderDTO 
  implements Partial<Pick<PurchaseOrder, 'title' | 'supplier' | 'items' | 'remark'>> {
  
  @Field({ type: FieldTypes.STRING, label: '订单标题' })
  title?: string;

  @Field({ type: FieldTypes.COMPOSITION, label: '供应商信息' })
  supplier?: SupplierInfoModel;

  @Field({ type: FieldTypes.COMPOSITION, label: '订单明细' })
  items?: PurchaseOrderItemModel[];

  @Field({ type: FieldTypes.STRING, label: '备注' })
  remark?: string;
}

// ==================== View DTO ====================

/**
 * 订单列表项 DTO
 * 
 * 🎯 继承 PurchaseOrder 的部分字段，扩展显示字段
 */
@DTO({ comment: '订单列表项' })
export class PurchaseOrderListItemDTO implements 
  Pick<PurchaseOrder, 'id' | 'orderNo' | 'title' | 'totalAmount' | 'status' | 'createdBy' | 'createdAt' | 'approvedBy' | 'approvedAt'> {
  
  @Field({ type: FieldTypes.STRING, label: '订单ID', required: true })
  id!: string;

  @Field({ type: FieldTypes.STRING, label: '订单编号', required: true })
  orderNo!: string;

  @Field({ type: FieldTypes.STRING, label: '订单标题', required: true })
  title!: string;

  @Field({ type: FieldTypes.NUMBER, label: '订单总额', required: true })
  totalAmount!: number;

  @Field({ type: FieldTypes.STRING, label: '订单状态', required: true })
  status?: PurchaseOrderStatusType;

  @Field({ type: FieldTypes.STRING, label: '创建人', required: true })
  createdBy!: string;

  @Field({ type: FieldTypes.DATETIME, label: '创建时间', required: true })
  createdAt!: Date;

  @Field({ type: FieldTypes.STRING, label: '审批人' })
  approvedBy?: string;

  @Field({ type: FieldTypes.DATETIME, label: '审批时间' })
  approvedAt?: Date;

  // 扩展字段
  @Field({ type: FieldTypes.STRING, label: '供应商名称', required: true })
  supplierName!: string;

  @Field({ type: FieldTypes.STRING, label: '状态文本', required: true })
  statusLabel!: string;
}

/**
 * 订单详情 DTO
 * 
 * 🎯 继承 PurchaseOrder，扩展显示字段和权限字段
 */
@DTO({ comment: '订单详情' })
export class PurchaseOrderDetailDTO extends PurchaseOrder {
  // 显示字段
  @Field({ type: FieldTypes.STRING, label: '状态文本', required: true })
  statusLabel!: string;

  // 操作权限
  @Field({ type: FieldTypes.BOOLEAN, label: '可编辑', required: true })
  canEdit!: boolean;

  @Field({ type: FieldTypes.BOOLEAN, label: '可提交', required: true })
  canSubmit!: boolean;

  @Field({ type: FieldTypes.BOOLEAN, label: '可审批', required: true })
  canApprove!: boolean;

  @Field({ type: FieldTypes.BOOLEAN, label: '可拒绝', required: true })
  canReject!: boolean;

  @Field({ type: FieldTypes.BOOLEAN, label: '可取消', required: true })
  canCancel!: boolean;

  @Field({ type: FieldTypes.BOOLEAN, label: '可删除', required: true })
  canDelete!: boolean;

  @Field({ type: FieldTypes.BOOLEAN, label: '可开始执行', required: true })
  canStartExecution!: boolean;

  @Field({ type: FieldTypes.BOOLEAN, label: '可完成', required: true })
  canComplete!: boolean;
}
