/**
 * 主程序：订单管理系统演示
 * 
 * 演示如何使用 RuntimeBootstrap 自动装配并运行完整业务流程
 */

import 'reflect-metadata';
import { RuntimeBootstrap } from '@ai-builder/runtime';
import { Order } from './domain/Order.model';
import { ProductAPI, CustomerAPI, OrderAPI } from './application/Order.app';

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 订单管理系统 - AI Builder 示例');
  console.log('='.repeat(60));
  console.log();

  // ========================================
  // 1. 启动 Runtime（自动装配所有组件）
  // ========================================
  console.log('📦 正在启动 Runtime...');
  
  const runtime = RuntimeBootstrap.create({
    mode: 'simulation',
    services: [
      // 应用服务
      ProductAPI,
      CustomerAPI,
      OrderAPI
    ],
    repos: {
      'Order': 'InMemory',
      'Customer': 'InMemory',
      'Product': 'InMemory',
      'OrderLine': 'InMemory'
    }
  });

  console.log('✅ Runtime 启动成功！');
  console.log();

  // 获取 API 服务实例（依赖已自动注入）
  const productAPI = runtime.get(ProductAPI);
  const customerAPI = runtime.get(CustomerAPI);
  const orderAPI = runtime.get(OrderAPI);

  try {
    // ========================================
    // 2. 准备基础数据
    // ========================================
    console.log('📝 创建基础数据...');
    console.log();

    // 创建产品
    console.log('创建产品：');
    const product1 = await productAPI.createProduct({
      name: 'MacBook Pro 16"',
      code: 'MBP-16-2024',
      price: 19999,
      stock: 10
    });
    console.log(`  ✓ ${product1.name} (${product1.code}) - ¥${product1.price} - 库存：${product1.stock}`);

    const product2 = await productAPI.createProduct({
      name: 'iPhone 15 Pro',
      code: 'IPH-15-PRO',
      price: 8999,
      stock: 20
    });
    console.log(`  ✓ ${product2.name} (${product2.code}) - ¥${product2.price} - 库存：${product2.stock}`);

    const product3 = await productAPI.createProduct({
      name: 'AirPods Pro',
      code: 'APP-PRO-2',
      price: 1899,
      stock: 50
    });
    console.log(`  ✓ ${product3.name} (${product3.code}) - ¥${product3.price} - 库存：${product3.stock}`);
    console.log();

    // 创建客户
    console.log('创建客户：');
    const customer = await customerAPI.createCustomer({
      name: '张三',
      email: 'zhangsan@example.com',
      phone: '13800138000',
      creditLimit: 50000
    });
    console.log(`  ✓ ${customer.name} - ${customer.email} - 信用额度：¥${customer.creditLimit}`);
    console.log();

    // ========================================
    // 3. 创建订单
    // ========================================
    console.log('📋 创建订单...');
    const order = await orderAPI.createOrder(customer.id!, [
      { productId: product1.id!, quantity: 1 },
      { productId: product2.id!, quantity: 2 },
      { productId: product3.id!, quantity: 3 }
    ]) as Order;

    console.log(`  ✓ 订单号：${order.orderNo}`);
    console.log(`  ✓ 客户：${customer.name}`);
    console.log(`  ✓ 状态：${order.status}`);
    console.log(`  ✓ 明细：`);
    for (const line of order.lines) {
      console.log(`    - ${line.product?.name} x ${line.quantity} = ¥${line.subtotal}`);
    }
    console.log(`  ✓ 订单总额：¥${order.totalAmount}`);
    console.log(`  ✓ 折扣金额：¥${order.discountAmount}`);
    console.log(`  ✓ 实付金额：¥${order.finalAmount}`);
    console.log();

    // ========================================
    // 4. 提交订单
    // ========================================
    console.log('✅ 提交订单...');
    const submittedOrder = await orderAPI.submitOrder(order.id!) as Order;
    console.log(`  ✓ 订单状态：${submittedOrder.status}`);
    console.log();

    // ========================================
    // 5. 确认订单（扣减库存）
    // ========================================
    console.log('🔒 确认订单（扣减库存）...');
    const confirmedOrder = await orderAPI.confirmOrder(order.id!) as Order;
    console.log(`  ✓ 订单状态：${confirmedOrder.status}`);
    
    // 检查库存
    const updatedProduct1 = await productAPI.getProduct(product1.id!);
    const updatedProduct2 = await productAPI.getProduct(product2.id!);
    const updatedProduct3 = await productAPI.getProduct(product3.id!);
    
    console.log('  ✓ 更新后的库存：');
    console.log(`    - ${updatedProduct1?.name}: ${updatedProduct1?.stock} (原 10, 扣减 1)`);
    console.log(`    - ${updatedProduct2?.name}: ${updatedProduct2?.stock} (原 20, 扣减 2)`);
    console.log(`    - ${updatedProduct3?.name}: ${updatedProduct3?.stock} (原 50, 扣减 3)`);
    console.log();

    // ========================================
    // 6. 查询订单列表
    // ========================================
    console.log('📊 查询订单列表...');
    const orderList = await orderAPI.listOrders(customer.id) as { list: Order[]; total: number };
    console.log(`  ✓ 找到 ${orderList.total} 个订单`);
    for (const o of orderList.list) {
      console.log(`    - ${o.orderNo} | ${o.status} | ¥${o.finalAmount}`);
    }
    console.log();

    // ========================================
    // 7. 测试业务规则：库存不足
    // ========================================
    console.log('❌ 测试业务规则：库存不足...');
    try {
      await orderAPI.createOrder(customer.id!, [
        { productId: product1.id!, quantity: 100 } // 库存只有 9 个（10-1）
      ]);
      console.log('  ✗ 应该抛出库存不足错误！');
    } catch (error: unknown) {
      const err = error as Error;
      console.log(`  ✓ 正确拒绝：${err.message}`);
    }
    console.log();

    // ========================================
    // 8. 测试业务规则：信用额度
    // ========================================
    console.log('💳 测试业务规则：信用额度...');
    
    // 先创建一个大订单（不提交）
    const bigOrder = await orderAPI.createOrder(customer.id!, [
      { productId: product1.id!, quantity: 2 } // ¥39,998
    ]) as Order;
    console.log(`  ✓ 创建大订单：¥${bigOrder.finalAmount}`);
    
    try {
      await orderAPI.submitOrder(bigOrder.id!);
      console.log('  ✗ 应该抛出信用额度不足错误！');
    } catch (error: unknown) {
      const err = error as Error;
      console.log(`  ✓ 正确拒绝：${err.message.split('！')[0]}！`);
    }
    console.log();

    // ========================================
    // 9. 测试取消订单
    // ========================================
    console.log('🚫 取消大订单...');
    const cancelledOrder = await orderAPI.cancelOrder(bigOrder.id!, '客户申请取消') as Order;
    console.log(`  ✓ 订单状态：${cancelledOrder.status}`);
    console.log(`  ✓ 备注：${cancelledOrder.remarks}`);
    console.log();

    // ========================================
    // 总结
    // ========================================
    console.log('='.repeat(60));
    console.log('✨ 演示完成！');
    console.log('='.repeat(60));
    console.log();
    console.log('本示例展示了：');
    console.log('  1. ✅ 使用 @Entity, @Field 定义领域模型');
    console.log('  2. ✅ 使用 @Composition, @Association 定义实体关系');
    console.log('  3. ✅ 使用 @Validation 定义校验规则');
    console.log('  4. ✅ 使用 @DomainLogic, @Action, @Rule 实现业务逻辑');
    console.log('  5. ✅ 使用 @AppService, @Expose 暴露 API');
    console.log('  6. ✅ 使用 @Inject 声明依赖注入');
    console.log('  7. ✅ 使用 RuntimeBootstrap 自动装配组件');
    console.log('  8. ✅ Decimal 高精度数值计算');
    console.log('  9. ✅ InMemoryRepo 内存仓储（可替换为真实数据库）');
    console.log(' 10. ✅ EventBus 事件发布（可扩展为消息队列）');
    console.log();

  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ 发生错误：', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// 运行主程序
main().catch(console.error);

