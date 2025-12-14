/**
 * 采购订单 DTO 定义
 * 
 * 基于领域模型派生，使用 TypeScript 工具类型
 * 遵循 Type-First MDA 架构原则
 */

import { DTO, Decimal, PageQuery } from '@ai-builder/dsl';
import { 
  PurchaseOrder,
  PurchaseOrderStatus, 
  PurchaseOrderItem as DomainPurchaseOrderItem, 
  SupplierInfo 
} from '../../domain/PurchaseOrder.model';

// ==================== Command DTO（写操作）====================

/**
 * 创建采购订单 DTO
 * 
 * 从 PurchaseOrder 中剔除自动生成的字段
 */
export interface CreatePurchaseOrderDTO extends 
  Omit<PurchaseOrder, 
    | 'id'              // 自动生成
    | 'orderNo'         // 自动生成
    | 'totalAmount'     // 计算得出
    | 'status'          // 默认为 DRAFT
    | 'createdAt'       // 自动生成
    | 'updatedAt'       // 自动生成
    | 'approvedBy'      // 审批后才有
    | 'approvedAt'      // 审批后才有
    | 'approvalComment' // 审批后才有
  >,
  DTO {}

/**
 * 更新采购订单 DTO
 * 
 * id 必填，其他字段可选
 */
export interface UpdatePurchaseOrderDTO extends 
  Partial<Omit<PurchaseOrder, 
    | 'id'              // 单独处理
    | 'orderNo'         // 不可修改
    | 'totalAmount'     // 计算得出
    | 'status'          // 通过状态机修改
    | 'createdAt'       // 不可修改
    | 'createdBy'       // 不可修改
    | 'approvedBy'      // 不可修改
    | 'approvedAt'      // 不可修改
  >>,
  DTO {
  id: string; // id 必填
}

/**
 * 简单操作 DTO（仅需 id）
 */
export interface SimplePurchaseOrderDTO extends Pick<PurchaseOrder, 'id'>, DTO {}

// 复用 SimplePurchaseOrderDTO
export type SubmitPurchaseOrderDTO = SimplePurchaseOrderDTO;
export type StartExecutionDTO = SimplePurchaseOrderDTO;
export type CompletePurchaseOrderDTO = SimplePurchaseOrderDTO;
export type DeletePurchaseOrderDTO = SimplePurchaseOrderDTO;

/**
 * 审批 DTO
 */
export interface ApprovePurchaseOrderDTO extends SimplePurchaseOrderDTO {
  approvedBy: string;
  comment?: string;
}

/**
 * 拒绝 DTO
 */
export interface RejectPurchaseOrderDTO extends SimplePurchaseOrderDTO {
  approvedBy: string;
  comment: string; // 拒绝必须填写原因
}

/**
 * 取消订单 DTO
 */
export interface CancelPurchaseOrderDTO extends SimplePurchaseOrderDTO {
  reason?: string;
}

// ==================== Query DTO（查询操作）====================

/**
 * 查询采购订单列表 DTO
 * 
 * 所有字段可选，用于筛选
 */
export interface GetPurchaseOrderListDTO extends PageQuery, DTO {
  status?: PurchaseOrderStatus;
  orderNo?: string;
  supplierName?: string;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * 查询采购订单详情 DTO
 */
export type GetPurchaseOrderDetailDTO = SimplePurchaseOrderDTO;

/**
 * 查询待审批的采购订单 DTO
 */
export interface GetPendingPurchaseOrdersDTO extends PageQuery, DTO {}

/**
 * 查询我的采购订单 DTO
 */
export interface GetMyPurchaseOrdersDTO extends PageQuery, DTO {
  userId: string;
  status?: PurchaseOrderStatus;
}

/**
 * 统计采购订单数量 DTO
 */
export interface CountPurchaseOrdersByStatusDTO extends DTO {
  userId?: string;
}

// ==================== View DTO（返回数据）====================

/**
 * 采购订单明细项（包含计算字段）
 */
export interface PurchaseOrderItemDTO extends DomainPurchaseOrderItem, DTO {
  amount: Decimal; // 计算字段：quantity * unitPrice
}

/**
 * 采购订单列表项 DTO
 * 
 * 从 PurchaseOrder 中选取列表显示需要的字段，并扩展连表查询字段
 */
export interface PurchaseOrderListItemDTO extends 
  Pick<PurchaseOrder, 
    | 'id' 
    | 'orderNo' 
    | 'title' 
    | 'totalAmount' 
    | 'status' 
    | 'createdBy' 
    | 'createdAt'
    | 'approvedBy'
    | 'approvedAt'
  >,
  DTO {
  [key: string]: unknown;
  // 扩展字段（连表查询或计算）
  supplierName: string;    // 从 supplier.name 提取
  statusLabel: string;     // 状态文本
}

/**
 * 采购订单详情 DTO
 * 
 * 继承完整的 PurchaseOrder，并扩展前端需要的字段
 */
export interface PurchaseOrderDetailDTO extends PurchaseOrder, DTO {
  // 计算字段
  statusLabel: string;
  
  // 操作权限（前端需要）
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canCancel: boolean;
  canDelete: boolean;
  canStartExecution: boolean;
  canComplete: boolean;
  
  // 重写 items，添加计算的 amount
  items: PurchaseOrderItemDTO[];
}

/**
 * 采购订单统计 DTO
 */
export interface PurchaseOrderStatisticsDTO extends DTO {
  draft: number;
  pending: number;
  approved: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  total: number;
}

// ==================== 辅助 DTO ====================

/**
 * 供应商选项 DTO
 */
export interface SupplierOptionDTO extends Pick<SupplierInfo, 'code' | 'name'>, DTO {
  contactPerson?: string;
  contactPhone?: string;
}

/**
 * 物料选项 DTO
 */
export interface MaterialOptionDTO extends DTO {
  code: string;
  name: string;
  specification?: string;
  unit: string;
  latestPrice?: Decimal;
}

// ==================== 常量 ====================

/**
 * 订单状态标签映射
 */
export const PurchaseOrderStatusLabels: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.DRAFT]: '草稿',
  [PurchaseOrderStatus.PENDING]: '待审批',
  [PurchaseOrderStatus.APPROVED]: '已审批',
  [PurchaseOrderStatus.IN_PROGRESS]: '执行中',
  [PurchaseOrderStatus.COMPLETED]: '已完成',
  [PurchaseOrderStatus.CANCELLED]: '已取消',
};

/**
 * 订单状态颜色映射（用于前端标签颜色）
 */
export const PurchaseOrderStatusColors: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.DRAFT]: 'default',
  [PurchaseOrderStatus.PENDING]: 'warning',
  [PurchaseOrderStatus.APPROVED]: 'success',
  [PurchaseOrderStatus.IN_PROGRESS]: 'processing',
  [PurchaseOrderStatus.COMPLETED]: 'success',
  [PurchaseOrderStatus.CANCELLED]: 'error',
};
