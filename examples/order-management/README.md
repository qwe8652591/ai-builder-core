# 订单管理系统示例

这是一个使用 `@ai-builder/dsl` 和 `@ai-builder/runtime` 构建的完整订单管理系统示例。

## 项目结构

```
examples/order-management/
├── src/
│   ├── domain/
│   │   ├── models.ts          # 领域模型（实体定义）
│   │   └── order-service.ts   # 领域逻辑（业务规则）
│   ├── application/
│   │   └── api-services.ts    # 应用服务（API 层）
│   └── main.ts                # 主程序（演示流程）
├── package.json
├── tsconfig.json
└── README.md
```

## 功能特性

### 1. 领域模型

**实体**：
- `Customer` - 客户（客户名称、邮箱、信用额度）
- `Product` - 产品（产品名称、代码、单价、库存）
- `Order` - 订单（订单号、客户、状态、金额）
- `OrderLine` - 订单明细（产品、数量、小计）

**关联关系**：
- `Order` → `Customer`（多对一，Association）
- `Order` → `OrderLine[]`（一对多，Composition）
- `OrderLine` → `Product`（多对一，Association）

**校验规则**：
- 客户名称：2-50 字符
- 邮箱格式验证
- 产品代码：大写字母和数字
- 订单状态：枚举值验证

### 2. 业务逻辑

**OrderService（领域服务）**：
- `createOrder` - 创建订单
- `submitOrder` - 提交订单
- `confirmOrder` - 确认订单（扣减库存）
- `cancelOrder` - 取消订单
- `listOrders` - 查询订单列表

**业务规则**：
- 自动计算订单金额
- 订单金额超过 ¥1000 享受 5% 折扣
- 库存检查（下单时）
- 信用额度检查（提交时）
- 状态流转控制（Draft → Submitted → Confirmed）

### 3. 应用服务

**ProductAPI**：
- `createProduct` - 创建产品
- `updateStock` - 更新库存
- `listProducts` - 产品列表
- `getProduct` - 获取产品详情

**CustomerAPI**：
- `createCustomer` - 创建客户
- `updateCreditLimit` - 更新信用额度
- `getCustomer` - 获取客户详情
- `listCustomers` - 客户列表

**OrderAPI**：
- `createOrder` - 创建订单
- `submitOrder` - 提交订单
- `confirmOrder` - 确认订单
- `cancelOrder` - 取消订单
- `listOrders` - 订单列表

## 快速开始

### 1. 安装依赖

```bash
cd examples/order-management
pnpm install
```

### 2. 运行示例

```bash
pnpm dev
```

### 3. 预期输出

```
============================================================
🚀 订单管理系统 - AI Builder 示例
============================================================

📦 正在启动 Runtime...
✅ Runtime 启动成功！

📝 创建基础数据...

创建产品：
  ✓ MacBook Pro 16" (MBP-16-2024) - ¥19999 - 库存：10
  ✓ iPhone 15 Pro (IPH-15-PRO) - ¥8999 - 库存：20
  ✓ AirPods Pro (APP-PRO-2) - ¥1899 - 库存：50

创建客户：
  ✓ 张三 - zhangsan@example.com - 信用额度：¥50000

📋 创建订单...
  ✓ 订单号：ORD-20231208-1234
  ✓ 客户：张三
  ✓ 状态：Draft
  ✓ 明细：
    - MacBook Pro 16" x 1 = ¥19999
    - iPhone 15 Pro x 2 = ¥17998
    - AirPods Pro x 3 = ¥5697
  ✓ 订单总额：¥43694
  ✓ 折扣金额：¥2184.7
  ✓ 实付金额：¥41509.3

✅ 提交订单...
  ✓ 订单状态：Submitted

🔒 确认订单（扣减库存）...
  ✓ 订单状态：Confirmed
  ✓ 更新后的库存：
    - MacBook Pro 16": 9 (原 10, 扣减 1)
    - iPhone 15 Pro: 18 (原 20, 扣减 2)
    - AirPods Pro: 47 (原 50, 扣减 3)

📊 查询订单列表...
  ✓ 找到 1 个订单
    - ORD-20231208-1234 | Confirmed | ¥41509.3

❌ 测试业务规则：库存不足...
  ✓ 正确拒绝：产品 MacBook Pro 16" 库存不足，当前库存：9，需要：100

💳 测试业务规则：信用额度...
  ✓ 创建大订单：¥39998
  ✓ 正确拒绝：超出信用额度！

🚫 取消大订单...
  ✓ 订单状态：Cancelled
  ✓ 备注：取消原因：客户申请取消

============================================================
✨ 演示完成！
============================================================

本示例展示了：
  1. ✅ 使用 @Entity, @Field 定义领域模型
  2. ✅ 使用 @Composition, @Association 定义实体关系
  3. ✅ 使用 @Validation 定义校验规则
  4. ✅ 使用 @DomainLogic, @Action, @Rule 实现业务逻辑
  5. ✅ 使用 @AppService, @Expose 暴露 API
  6. ✅ 使用 @Inject 声明依赖注入
  7. ✅ 使用 RuntimeBootstrap 自动装配组件
  8. ✅ Decimal 高精度数值计算
  9. ✅ InMemoryRepo 内存仓储（可替换为真实数据库）
 10. ✅ EventBus 事件发布（可扩展为消息队列）
```

## 核心概念

### 1. DSL-First（领域优先）

**✅ 用户代码只依赖 `@ai-builder/dsl`，不直接引用 Runtime 实现**：

```typescript
// ✅ 正确：只导入类型和装饰器
import { Entity, Field, DomainLogic, Action, Inject } from '@ai-builder/dsl';
import type { Repo, EventBus, DecimalConstructor } from '@ai-builder/dsl';

@DomainLogic()
class OrderService {
  // ✅ 通过 @Inject 注入依赖（类型来自 DSL）
  @Inject('Repo<Order>')
  private orderRepo!: Repo<Order, string>;
  
  @Inject('Decimal')
  private Decimal!: DecimalConstructor;  // 注入构造函数
  
  @Action()
  async createOrder() {
    const amount = new this.Decimal(100);  // ✅ 通过注入的构造函数创建实例
    // ...
  }
}
```

**❌ 错误：直接导入 Runtime 实现**：

```typescript
// ❌ 业务代码不应直接引用 Runtime
import { Decimal, InMemoryRepo } from '@ai-builder/runtime';

class OrderService {
  private orderRepo = new InMemoryRepo();  // ❌ 硬编码实现
  private amount = new Decimal(100);       // ❌ 直接使用实现类
}
```

**✅ 只有启动文件可以导入 Runtime**：

```typescript
// main.ts - 启动文件
import { RuntimeBootstrap } from '@ai-builder/runtime';  // ✅ 启动文件可以导入

const runtime = RuntimeBootstrap.create({
  services: [OrderService],
  repos: { 'Order': 'InMemory' }
});
```

### 2. Auto-Wiring（自动装配）

**启动时通过 `RuntimeBootstrap` 自动装配所有组件**：

```typescript
import { RuntimeBootstrap } from '@ai-builder/runtime';

const runtime = RuntimeBootstrap.create({
  mode: 'simulation',
  services: [OrderService, ProductAPI, CustomerAPI],
  repos: {
    'Order': 'InMemory',      // 仿真模式：内存仓储
    'Product': PostgresRepo,  // 生产模式：真实数据库
  }
});

// 获取服务实例（依赖已自动注入）
const orderService = runtime.get(OrderService);
```

### 3. Pluggable（可插拔）

**任何组件都可以替换实现**：

- `InMemoryRepo` → `PostgresRepo` / `MongoRepo`
- `LocalEventBus` → `RabbitMQ` / `Kafka`
- `ThreadLocalSecurityContext` → `JWTSecurityContext`

### 4. Simulatable（可仿真）

**默认提供内存实现，开箱即用**：

- 无需数据库，直接运行
- 快速原型验证
- 单元测试友好

## 扩展示例

### 替换为真实数据库

```typescript
import { Repo } from '@ai-builder/dsl';
import { Pool } from 'pg';

class PostgresOrderRepo implements Repo<Order, string> {
  constructor(private pool: Pool) {}
  
  async findById(id: string): Promise<Order | null> {
    const result = await this.pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }
  
  // ... 实现其他方法
}

// 注册自定义实现
const runtime = RuntimeBootstrap.create({
  repos: {
    'Order': new PostgresOrderRepo(pool)
  }
});
```

### 添加事件监听器

```typescript
import { RuntimeBootstrap } from '@ai-builder/runtime';

const runtime = RuntimeBootstrap.create({
  // ...
});

const eventBus = runtime.get('EventBus');

// 监听订单创建事件
eventBus.subscribe('OrderCreated', async (event) => {
  console.log(`订单已创建：${event.orderId}`);
  // 发送邮件通知、记录日志等
});

// 监听所有事件
eventBus.subscribe('*', async (event) => {
  console.log('事件:', event);
});
```

### 添加生命周期钩子

```typescript
const hooks = runtime.get('Hooks');

// 保存前钩子
hooks.registerBefore('save', async (entity) => {
  console.log('即将保存:', entity);
  // 添加审计信息、多租户过滤等
});

// 保存后钩子
hooks.registerAfter('save', async (entity) => {
  console.log('已保存:', entity);
  // 发送通知、更新缓存等
});
```

## 下一步

1. **查看源码**：阅读 `src/` 目录下的代码，了解实现细节
2. **修改示例**：尝试添加新的实体、业务规则
3. **扩展功能**：集成真实数据库、消息队列
4. **开发 CLI**：基于 DSL 元数据生成代码
5. **可视化编辑器**：拖拽式建模工具

## 技术栈

- **语言**: TypeScript 5.3+
- **DSL**: `@ai-builder/dsl` (装饰器、类型系统)
- **Runtime**: `@ai-builder/runtime` (IoC、Repo、EventBus)
- **数值**: `decimal.js-light` (高精度)
- **执行**: `tsx` (TypeScript 直接运行)

## License

MIT

