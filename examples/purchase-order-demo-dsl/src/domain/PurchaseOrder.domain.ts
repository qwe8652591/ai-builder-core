/**
 * 采购订单领域逻辑（纯函数）
 * 
 * ⚠️ Domain 层约束：
 * 1. 必须是纯函数（无副作用）
 * 2. 禁止 async/await（必须同步执行）
 * 3. 禁止使用 this（必须是静态方法或纯函数）
 * 4. 禁止 IO 操作（数据库、网络、文件）
 * 5. 所有数据通过参数传入，包括 DecimalConstructor
 * 
 * ✅ Domain 层职责：
 * - 核心业务规则计算
 * - 状态验证和转换
 * - 领域概念的纯函数表达
 */

import { DomainLogic, Rule } from '@ai-builder/dsl';
import type { Decimal, DecimalConstructor } from '@ai-builder/dsl';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from './PurchaseOrder.model';

/**
 * 采购订单领域逻辑
 */
@DomainLogic()
export class PurchaseOrderDomain {
  // ==================== 基础验证规则 ====================
  // 注意：以下基础验证规则已通过 @Validation 装饰器在 Model 层声明
  // 这些方法保留用于：
  // 1. 向后兼容
  // 2. 需要在业务逻辑中显式调用验证的场景
  // 3. 复杂的跨字段验证逻辑
  
  /**
   * 验证规则：订单编号格式
   * 错误消息：订单编号格式错误，应为 PO + 8位数字
   * 
   * @deprecated 已通过 @Validation 装饰器在 PurchaseOrder.orderNo 字段上声明
   */
  static validateOrderNoFormat(orderNo: string): boolean {
    const pattern = /^PO\d{8}$/;
    return pattern.test(orderNo);
  }

  /**
   * 验证规则：订单明细不能为空
   * 错误消息：订单明细不能为空
   * 
   * @deprecated 已通过 @Validation 装饰器在 PurchaseOrder.items 字段上声明
   */
  static validateItemsNotEmpty(items: PurchaseOrderItem[]): boolean {
    return items && items.length > 0;
  }

  /**
   * 验证规则：采购数量必须大于0
   * 错误消息：采购数量必须大于0
   * 
   * @deprecated 已通过 @Validation 装饰器在 PurchaseOrderItem.quantity 字段上声明
   */
  static validateItemQuantity(item: PurchaseOrderItem, DecimalCtor: DecimalConstructor): boolean {
    return item.quantity.greaterThan(new DecimalCtor(0));
  }

  /**
   * 验证规则：单价必须大于等于0
   * 错误消息：单价必须大于等于0
   */
  static validateItemUnitPrice(item: PurchaseOrderItem, DecimalCtor: DecimalConstructor): boolean {
    const zero = new DecimalCtor(0);
    return item.unitPrice.greaterThan(zero) || item.unitPrice.equals(zero);
  }

  /**
   * 验证规则：订单总额必须大于0
   * 错误消息：订单总额必须大于0
   */
  static validateTotalAmount(items: PurchaseOrderItem[], DecimalCtor: DecimalConstructor): boolean {
    const totalAmount = PurchaseOrderDomain.calculateTotalAmount(items, DecimalCtor);
    return totalAmount.greaterThan(new DecimalCtor(0));
  }

  /**
   * 验证规则：需求日期不能早于当前日期
   * 错误消息：需求日期不能早于当前日期
   */
  static validateRequiredDate(item: PurchaseOrderItem): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return item.requiredDate >= today;
  }

  /**
   * 业务规则：生成订单编号
   */
  @Rule()
  static generateOrderNo(): string {
    const timestamp = Date.now().toString().slice(-8);
    return `PO${timestamp}`;
  }

  /**
   * 业务规则：计算订单明细金额
   */
  @Rule()
  static calculateItemAmount(item: PurchaseOrderItem, DecimalCtor: DecimalConstructor): Decimal {
    return new DecimalCtor(item.quantity.mul(item.unitPrice).toString());
  }

  /**
   * 业务规则：计算订单总额
   */
  @Rule()
  static calculateTotalAmount(items: PurchaseOrderItem[], DecimalCtor: DecimalConstructor): Decimal {
    if (!items || items.length === 0) {
      return new DecimalCtor(0);
    }
    let total = new DecimalCtor(0);
    for (const item of items) {
      const itemAmount = PurchaseOrderDomain.calculateItemAmount(item, DecimalCtor);
      total = new DecimalCtor(total.add(itemAmount).toString());
    }
    return total;
  }

  /**
   * 业务规则：检查订单是否可以提交审批
   */
  @Rule()
  static canSubmitForApproval(order: PurchaseOrder, DecimalCtor: DecimalConstructor): boolean {
    const totalAmount = PurchaseOrderDomain.calculateTotalAmount(order.items, DecimalCtor);
    return order.status === PurchaseOrderStatus.DRAFT &&
           order.items.length > 0 &&
           totalAmount.greaterThan(new DecimalCtor(0));
  }

  /**
   * 业务规则：检查订单是否可以审批
   */
  @Rule()
  static canApprove(order: PurchaseOrder): boolean {
    return order.status === PurchaseOrderStatus.PENDING;
  }

  /**
   * 业务规则：检查订单是否可以取消
   */
  @Rule()
  static canCancel(order: PurchaseOrder): boolean {
    return order.status === PurchaseOrderStatus.DRAFT ||
           order.status === PurchaseOrderStatus.PENDING;
  }

  /**
   * 业务规则：检查订单是否可以编辑
   */
  @Rule()
  static canEdit(order: PurchaseOrder): boolean {
    return order.status === PurchaseOrderStatus.DRAFT;
  }

  /**
   * 业务规则：检查订单是否可以删除
   */
  @Rule()
  static canDelete(order: PurchaseOrder): boolean {
    return order.status === PurchaseOrderStatus.DRAFT ||
           order.status === PurchaseOrderStatus.CANCELLED;
  }

  /**
   * 业务规则：提交审批
   */
  @Rule()
  static submitForApproval(order: PurchaseOrder, DecimalCtor: DecimalConstructor): void {
    if (!PurchaseOrderDomain.canSubmitForApproval(order, DecimalCtor)) {
      throw new Error('订单状态不允许提交审批');
    }
    order.status = PurchaseOrderStatus.PENDING;
    order.updatedAt = new Date();
  }

  /**
   * 业务规则：审批通过
   */
  @Rule()
  static approve(
    order: PurchaseOrder,
    approvedBy: string,
    comment?: string
  ): void {
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
  @Rule()
  static reject(
    order: PurchaseOrder,
    approvedBy: string,
    comment: string
  ): void {
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
  @Rule()
  static cancel(order: PurchaseOrder, reason?: string): void {
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
  @Rule()
  static startExecution(order: PurchaseOrder): void {
    if (order.status !== PurchaseOrderStatus.APPROVED) {
      throw new Error('只有已审批的订单才能开始执行');
    }
    order.status = PurchaseOrderStatus.IN_PROGRESS;
    order.updatedAt = new Date();
  }

  /**
   * 业务规则：完成订单
   */
  @Rule()
  static complete(order: PurchaseOrder): void {
    if (order.status !== PurchaseOrderStatus.IN_PROGRESS) {
      throw new Error('只有执行中的订单才能完成');
    }
    order.status = PurchaseOrderStatus.COMPLETED;
    order.updatedAt = new Date();
  }
}
