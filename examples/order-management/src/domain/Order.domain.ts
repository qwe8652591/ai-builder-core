/**
 * 订单领域逻辑（纯函数）
 * 
 * ⚠️ Domain 层约束：
 * 1. 必须是纯函数（无副作用）
 * 2. 禁止 async/await（必须同步执行）
 * 3. 禁止使用 this（必须是静态方法或纯函数）
 * 4. 禁止 IO 操作（数据库、网络、文件）
 * 5. 所有数据通过参数传入
 * 
 * ✅ Domain 层职责：
 * - 核心业务规则计算
 * - 状态验证和转换
 * - 领域概念的纯函数表达
 * 
 * 📌 注意：
 * 涉及 IO 操作的业务逻辑应该放在 Application 层（Order.app.ts）
 */

import { DomainLogic } from '@ai-builder/dsl';
import type { Decimal, DecimalConstructor } from '@ai-builder/dsl';
import type { Order, OrderLine } from './Order.model';

/**
 * 订单领域逻辑
 * 
 * 这些是可以在前后端同构执行的纯计算逻辑
 */
@DomainLogic()
export class OrderDomainLogic {
  /**
   * 计算订单明细小计
   * 
   * @param unitPrice 单价
   * @param quantity 数量
   * @param DecimalCtor Decimal 构造函数
   * @returns 小计金额
   */
  static calculateLineSubtotal(
    unitPrice: Decimal,
    quantity: number,
    DecimalCtor: DecimalConstructor
  ): Decimal {

    
    // 使用构造函数创建新实例以满足类型要求
    return new DecimalCtor(unitPrice.mul(quantity).toString());
  }

  /**
   * 计算订单总金额
   * 
   * @param lines 订单明细数组
   * @param DecimalCtor Decimal 构造函数
   * @returns 总金额
   */
  static calculateTotalAmount(
    lines: OrderLine[],
    DecimalCtor: DecimalConstructor
  ): Decimal {
    let total = new DecimalCtor(0);
    for (const line of lines) {
      total = new DecimalCtor(total.add(line.subtotal).toString());
    }
    return total;
  }

  /**
   * 计算折扣金额
   * 
   * 业务规则：订单金额超过1000，享受5%折扣
   * 
   * @param totalAmount 总金额
   * @param DecimalCtor Decimal 构造函数
   * @returns 折扣金额
   */
  static calculateDiscountAmount(
    totalAmount: Decimal,
    DecimalCtor: DecimalConstructor
  ): Decimal {
    if (totalAmount.greaterThan(1000)) {
      return new DecimalCtor(totalAmount.mul(0.05).toString());
    }
    return new DecimalCtor(0);
  }

  /**
   * 计算实付金额
   * 
   * @param totalAmount 总金额
   * @param discountAmount 折扣金额
   * @param DecimalCtor Decimal 构造函数
   * @returns 实付金额
   */
  static calculateFinalAmount(
    totalAmount: Decimal,
    discountAmount: Decimal,
    DecimalCtor: DecimalConstructor
  ): Decimal {
    return new DecimalCtor(totalAmount.sub(discountAmount).toString());
  }

  /**
   * 验证订单状态是否可以提交
   * 
   * @param status 当前状态
   * @returns 是否可以提交
   */
  static canSubmit(status: Order['status']): boolean {
    return status === 'Draft';
  }

  /**
   * 验证订单状态是否可以确认
   * 
   * @param status 当前状态
   * @returns 是否可以确认
   */
  static canConfirm(status: Order['status']): boolean {
    return status === 'Submitted';
  }

  /**
   * 验证订单状态是否可以取消
   * 
   * @param status 当前状态
   * @returns 是否可以取消
   */
  static canCancel(status: Order['status']): boolean {
    return status === 'Draft' || status === 'Submitted';
  }

  /**
   * 验证产品库存是否充足
   * 
   * @param stock 库存数量
   * @param requiredQuantity 需求数量
   * @returns 是否充足
   */
  static isStockSufficient(stock: number, requiredQuantity: number): boolean {
    return stock >= requiredQuantity;
  }

  /**
   * 验证信用额度是否足够
   * 
   * @param creditLimit 信用额度
   * @param usedCredit 已使用额度
   * @param orderAmount 订单金额
   * @returns 是否足够
   */
  static isCreditSufficient(
    creditLimit: Decimal,
    usedCredit: Decimal,
    orderAmount: Decimal
  ): boolean {
    const totalRequired = usedCredit.add(orderAmount);
    // 使用 gte (greater than or equal) 方法
    return creditLimit.gte(totalRequired);
  }

  /**
   * 生成订单号
   * 
   * @param date 日期
   * @param sequence 序列号
   * @returns 订单号
   */
  static generateOrderNo(date: Date, sequence: number): string {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const seqStr = sequence.toString().padStart(4, '0');
    return `ORD-${dateStr}-${seqStr}`;
  }

  /**
   * 格式化订单金额显示
   * 
   * @param amount 金额
   * @returns 格式化字符串
   */
  static formatAmount(amount: Decimal): string {
    return `¥${amount.toFixed(2)}`;
  }

  /**
   * 判断订单是否超过阈值（用于 UI 高亮显示）
   * 
   * @param amount 金额
   * @param threshold 阈值
   * @returns 是否超过
   */
  static isHighValueOrder(amount: Decimal, threshold: number): boolean {
    return amount.greaterThan(threshold);
  }
}
