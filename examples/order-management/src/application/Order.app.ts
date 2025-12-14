/**
 * 订单应用服务
 * 
 * 演示如何使用构造函数注入（不依赖装饰器）
 */

import { AppService, Action, Expose } from '@ai-builder/dsl';
import type { Repo, EventBus, DecimalConstructor } from '@ai-builder/dsl';
import { Product, Customer, Order, OrderLine } from '../domain/Order.model';
import { OrderDomainLogic } from '../domain/Order.domain';

/**
 * 产品管理 API
 */
@AppService()
@Expose()
export class ProductAPI {
  constructor(
    private productRepo: Repo<Product, string>,
    private Decimal: DecimalConstructor
  ) {}

  @Action()
  @Expose()
  async createProduct(data: { name: string; code: string; price: number; stock: number }): Promise<Product> {
    const product = new Product();
    product.name = data.name;
    product.code = data.code;
    product.price = new this.Decimal(data.price);
    product.stock = data.stock;

    return this.productRepo.save(product);
  }

  @Action()
  @Expose()
  async updateStock(productId: string, quantity: number): Promise<Product> {
    const product = await this.productRepo.findByIdOrThrow(productId);
    product.stock += quantity;
    return this.productRepo.save(product);
  }

  @Action()
  @Expose()
  async listProducts(): Promise<unknown> {
    return this.productRepo.findPage({}, { pageNo: 1, pageSize: 50 });
  }

  @Action()
  @Expose()
  async getProduct(productId: string): Promise<Product | null> {
    return this.productRepo.findById(productId);
  }
}

/**
 * 客户管理 API
 */
@AppService()
@Expose()
export class CustomerAPI {
  constructor(
    private customerRepo: Repo<Customer, string>,
    private Decimal: DecimalConstructor
  ) {}

  @Action()
  @Expose()
  async createCustomer(data: { name: string; email: string; phone?: string; creditLimit: number }): Promise<Customer> {
    const customer = new Customer();
    customer.name = data.name;
    customer.email = data.email;
    customer.phone = data.phone;
    customer.creditLimit = new this.Decimal(data.creditLimit);
    customer.createdAt = new Date();

    return this.customerRepo.save(customer);
  }

  @Action()
  @Expose()
  async updateCreditLimit(customerId: string, newLimit: number): Promise<Customer> {
    const customer = await this.customerRepo.findByIdOrThrow(customerId);
    customer.creditLimit = new this.Decimal(newLimit);
    return this.customerRepo.save(customer);
  }

  @Action()
  @Expose()
  async getCustomer(customerId: string): Promise<Customer | null> {
    return this.customerRepo.findById(customerId);
  }

  @Action()
  @Expose()
  async listCustomers(): Promise<unknown> {
    return this.customerRepo.findPage({}, { pageNo: 1, pageSize: 50 });
  }
}

/**
 * 订单管理 API
 */
@AppService()
@Expose()
export class OrderAPI {
  constructor(
    private orderRepo: Repo<Order, string>,
    private productRepo: Repo<Product, string>,
    private customerRepo: Repo<Customer, string>,
    private eventBus: EventBus,
    private Decimal: DecimalConstructor
  ) {}

  /**
   * 创建订单
   */
  @Action()
  @Expose()
  async createOrder(customerId: string, lines: Array<{ productId: string; quantity: number }>): Promise<Order> {
    const customer = await this.customerRepo.findByIdOrThrow(customerId);
    const order = new Order();
    order.orderNo = OrderDomainLogic.generateOrderNo(new Date(), Math.floor(Math.random() * 10000));
    order.customerId = customerId;
    order.customer = customer;
    order.status = 'Draft';
    order.orderedAt = new Date();

    for (const lineData of lines) {
      const product = await this.productRepo.findByIdOrThrow(lineData.productId);
      if (!OrderDomainLogic.isStockSufficient(product.stock, lineData.quantity)) {
        throw new Error(`产品 ${product.name} 库存不足，当前库存：${product.stock}，需要：${lineData.quantity}`);
      }

      const line = new OrderLine();
      line.productId = product.id!;
      line.product = product;
      line.quantity = lineData.quantity;
      line.unitPrice = new this.Decimal(product.price as unknown as number);
      line.subtotal = OrderDomainLogic.calculateLineSubtotal(line.unitPrice, line.quantity, this.Decimal);
      order.lines.push(line);
    }

    const totalAmount = OrderDomainLogic.calculateTotalAmount(order.lines, this.Decimal);
    const discountAmount = OrderDomainLogic.calculateDiscountAmount(totalAmount, this.Decimal);
    const finalAmount = OrderDomainLogic.calculateFinalAmount(totalAmount, discountAmount, this.Decimal);
    
    order.totalAmount = totalAmount;
    order.discountAmount = discountAmount;
    order.finalAmount = finalAmount;

    const savedOrder = await this.orderRepo.save(order);
    await this.eventBus.publish({
      constructor: { name: 'OrderCreated' },
      orderId: savedOrder.id,
      customerId: savedOrder.customerId,
      totalAmount: savedOrder.totalAmount.toString()
    });
    return savedOrder;
  }

  /**
   * 提交订单
   */
  @Action()
  @Expose()
  async submitOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findByIdOrThrow(orderId);
    if (!OrderDomainLogic.canSubmit(order.status)) {
      throw new Error(`订单状态为 ${order.status}，无法提交`);
    }

    const customer = await this.customerRepo.findByIdOrThrow(order.customerId);
    const pendingOrders = await this.orderRepo.find({
      customerId: customer.id,
      status: 'Confirmed' as Order['status']
    });
    
    // 计算已使用的信用额度
    let usedCredit = new this.Decimal(0);
    for (const o of pendingOrders) {
      usedCredit = usedCredit.add(o.finalAmount);
    }

    if (!OrderDomainLogic.isCreditSufficient(customer.creditLimit, usedCredit, order.finalAmount)) {
      throw new Error(
        `超出信用额度！客户额度：${customer.creditLimit}，` +
        `已使用：${usedCredit}，` +
        `当前订单：${order.finalAmount}`
      );
    }

    order.status = 'Submitted';
    const updated = await this.orderRepo.save(order);
    await this.eventBus.publish({
      constructor: { name: 'OrderSubmitted' },
      orderId: updated.id,
      customerId: updated.customerId
    });
    return updated;
  }

  /**
   * 确认订单
   */
  @Action()
  @Expose()
  async confirmOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findByIdOrThrow(orderId);
    if (!OrderDomainLogic.canConfirm(order.status)) {
      throw new Error(`订单状态为 ${order.status}，无法确认`);
    }

    for (const line of order.lines) {
      const product = await this.productRepo.findByIdOrThrow(line.productId);
      product.stock -= line.quantity;
      await this.productRepo.save(product);
    }

    order.status = 'Confirmed';
    const updated = await this.orderRepo.save(order);
    await this.eventBus.publish({
      constructor: { name: 'OrderConfirmed' },
      orderId: updated.id
    });
    return updated;
  }

  /**
   * 取消订单
   */
  @Action()
  @Expose()
  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const order = await this.orderRepo.findByIdOrThrow(orderId);
    if (!OrderDomainLogic.canCancel(order.status)) {
      throw new Error(`订单状态为 ${order.status}，无法取消`);
    }

    order.status = 'Cancelled';
    order.remarks = `取消原因：${reason}`;
    const updated = await this.orderRepo.save(order);
    await this.eventBus.publish({
      constructor: { name: 'OrderCancelled' },
      orderId: updated.id,
      reason
    });
    return updated;
  }

  /**
   * 查询订单列表
   */
  @Action()
  @Expose()
  async listOrders(customerId?: string, status?: string): Promise<unknown> {
    const query: Partial<Order> = {};
    if (customerId) query.customerId = customerId;
    if (status) query.status = status as Order['status'];

    return this.orderRepo.findPage(query, { pageNo: 1, pageSize: 20 });
  }
}
