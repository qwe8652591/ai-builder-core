/**
 * 采购订单领域逻辑 - 装饰器版本
 * 
 * 使用装饰器语法定义领域逻辑（纯函数）
 * 
 * ⚠️ Domain 层约束：
 * 1. 必须是纯函数（无副作用）
 * 2. 禁止 async/await（必须同步执行）
 * 3. 禁止 IO 操作（数据库、网络、文件）
 * 4. 所有数据通过参数传入
 */

import { 
  DomainLogic, 
  Validation, 
  Computation, 
  Check, 
  Action,
} from '@qwe8652591/dsl-core';
import { PurchaseOrderStatus } from '../models/PurchaseOrder.model';

// ==================== 类型定义 ====================

/** 订单数据类型（运行时使用） */
interface OrderData {
  status: string;
  items: ItemData[];
  remark?: string;
  updatedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  approvalComment?: string;
}

/** 明细项数据类型 */
interface ItemData {
  quantity: number;
  unitPrice: number;
  requiredDate?: Date;
}

// ==================== 领域逻辑（装饰器版本）====================

/**
 * 采购订单领域逻辑
 */
@DomainLogic({ description: '采购订单领域逻辑' })
export class PurchaseOrderDomain {
  
  // ==================== 验证规则 ====================
  
  /**
   * 验证规则：订单编号格式
   */
  @Validation({ 
    description: '订单编号格式验证',
    message: '订单编号格式错误，应为 PO + 8位数字',
  })
  static validateOrderNoFormat(orderNo: string): boolean {
    const pattern = /^PO\d{8}$/;
    return pattern.test(orderNo);
  }
  
  /**
   * 验证规则：订单明细不能为空
   */
  @Validation({ 
    description: '订单明细非空验证',
    message: '订单明细不能为空',
  })
  static validateItemsNotEmpty(items: ItemData[]): boolean {
    return items && items.length > 0;
  }
  
  /**
   * 验证规则：采购数量必须大于0
   */
  @Validation({ 
    description: '采购数量验证',
    message: '采购数量必须大于0',
  })
  static validateItemQuantity(item: ItemData): boolean {
    return item.quantity > 0;
  }
  
  /**
   * 验证规则：单价必须大于等于0
   */
  @Validation({ 
    description: '单价验证',
    message: '单价必须大于等于0',
  })
  static validateItemUnitPrice(item: ItemData): boolean {
    return item.unitPrice >= 0;
  }
  
  /**
   * 验证规则：需求日期不能早于当前日期
   */
  @Validation({ 
    description: '需求日期验证',
    message: '需求日期不能早于当前日期',
  })
  static validateRequiredDate(item: ItemData): boolean {
    if (!item.requiredDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return item.requiredDate >= today;
  }
  
  /**
   * 验证规则：订单总额必须大于0
   */
  @Validation({ 
    description: '订单总额验证',
    message: '订单总额必须大于0',
  })
  static validateTotalAmount(items: ItemData[]): boolean {
    const total = PurchaseOrderDomain.calculateTotalAmount(items);
    return total > 0;
  }
  
  // ==================== 计算规则 ====================
  
  /**
   * 业务规则：生成订单编号
   */
  @Computation({ description: '生成订单编号' })
  static generateOrderNo(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `PO${timestamp}`;
  }
  
  /**
   * 业务规则：计算订单明细金额
   */
  @Computation({ description: '计算明细金额' })
  static calculateItemAmount(item: ItemData): number {
    return item.quantity * item.unitPrice;
  }
  
  /**
   * 业务规则：计算订单总额
   */
  @Computation({ description: '计算订单总额' })
  static calculateTotalAmount(items: ItemData[]): number {
    if (!items || items.length === 0) {
      return 0;
    }
    return items.reduce((total, item) => {
      return total + PurchaseOrderDomain.calculateItemAmount(item);
    }, 0);
  }
  
  // ==================== 状态检查 ====================
  
  /**
   * 业务规则：检查订单是否可以提交审批
   */
  @Check({ description: '检查是否可提交审批' })
  static canSubmitForApproval(order: OrderData): boolean {
    const totalAmount = PurchaseOrderDomain.calculateTotalAmount(order.items);
    return order.status === PurchaseOrderStatus.DRAFT &&
           order.items.length > 0 &&
           totalAmount > 0;
  }
  
  /**
   * 业务规则：检查订单是否可以审批
   */
  @Check({ description: '检查是否可审批' })
  static canApprove(order: OrderData): boolean {
    return order.status === PurchaseOrderStatus.PENDING;
  }
  
  /**
   * 业务规则：检查订单是否可以取消
   */
  @Check({ description: '检查是否可取消' })
  static canCancel(order: OrderData): boolean {
    return order.status === PurchaseOrderStatus.DRAFT || 
           order.status === PurchaseOrderStatus.PENDING;
  }
  
  /**
   * 业务规则：检查订单是否可以编辑
   */
  @Check({ description: '检查是否可编辑' })
  static canEdit(order: OrderData): boolean {
    return order.status === PurchaseOrderStatus.DRAFT;
  }
  
  /**
   * 业务规则：检查订单是否可以删除
   */
  @Check({ description: '检查是否可删除' })
  static canDelete(order: OrderData): boolean {
    return order.status === PurchaseOrderStatus.DRAFT || 
           order.status === PurchaseOrderStatus.CANCELLED;
  }
  
  /**
   * 业务规则：检查订单是否可以开始执行
   */
  @Check({ description: '检查是否可开始执行' })
  static canStartExecution(order: OrderData): boolean {
    return order.status === PurchaseOrderStatus.APPROVED;
  }
  
  /**
   * 业务规则：检查订单是否可以完成
   */
  @Check({ description: '检查是否可完成' })
  static canComplete(order: OrderData): boolean {
    return order.status === PurchaseOrderStatus.IN_PROGRESS;
  }
  
  // ==================== 状态转换动作 ====================
  
  /**
   * 业务规则：提交审批
   */
  @Action({ description: '提交审批' })
  static submitForApproval(order: OrderData): void {
    if (!PurchaseOrderDomain.canSubmitForApproval(order)) {
      throw new Error('订单状态不允许提交审批');
    }
    order.status = PurchaseOrderStatus.PENDING;
    order.updatedAt = new Date();
  }
  
  /**
   * 业务规则：审批通过
   */
  @Action({ description: '审批通过' })
  static approve(order: OrderData, approvedBy: string, comment?: string): void {
    if (!PurchaseOrderDomain.canApprove(order)) {
      throw new Error('订单状态不允许审批');
    }
    order.status = PurchaseOrderStatus.APPROVED;
    order.approvedBy = approvedBy;
    order.approvedAt = new Date();
    order.approvalComment = comment;
    order.updatedAt = new Date();
  }
  
  /**
   * 业务规则：审批拒绝
   */
  @Action({ description: '审批拒绝' })
  static reject(order: OrderData, approvedBy: string, comment: string): void {
    if (!PurchaseOrderDomain.canApprove(order)) {
      throw new Error('订单状态不允许审批');
    }
    order.status = PurchaseOrderStatus.DRAFT;
    order.approvedBy = approvedBy;
    order.approvedAt = new Date();
    order.approvalComment = comment;
    order.updatedAt = new Date();
  }
  
  /**
   * 业务规则：取消订单
   */
  @Action({ description: '取消订单' })
  static cancel(order: OrderData, reason?: string): void {
    if (!PurchaseOrderDomain.canCancel(order)) {
      throw new Error('订单状态不允许取消');
    }
    order.status = PurchaseOrderStatus.CANCELLED;
    if (reason) {
      order.remark = `${order.remark || ''}\n取消原因: ${reason}`;
    }
    order.updatedAt = new Date();
  }
  
  /**
   * 业务规则：开始执行订单
   */
  @Action({ description: '开始执行订单' })
  static startExecution(order: OrderData): void {
    if (!PurchaseOrderDomain.canStartExecution(order)) {
      throw new Error('只有已审批的订单才能开始执行');
    }
    order.status = PurchaseOrderStatus.IN_PROGRESS;
    order.updatedAt = new Date();
  }
  
  /**
   * 业务规则：完成订单
   */
  @Action({ description: '完成订单' })
  static complete(order: OrderData): void {
    if (!PurchaseOrderDomain.canComplete(order)) {
      throw new Error('只有执行中的订单才能完成');
    }
    order.status = PurchaseOrderStatus.COMPLETED;
    order.updatedAt = new Date();
  }
}

