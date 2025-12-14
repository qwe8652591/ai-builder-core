# @ai-builder/runtime

Runtime core package providing implementations for `@ai-builder/dsl` primitives with auto-wiring support.

## 架构设计

本包采用 **自动装配（Auto-Wiring）** 模式：
- ✅ 用户代码只需使用 `@Inject` 装饰器声明依赖
- ✅ 启动时通过 `RuntimeBootstrap` 自动装配所有组件
- ✅ 符合 DSL-First 和可插拔架构原则

## 安装

```bash
pnpm add @ai-builder/runtime @ai-builder/dsl
```

## 快速开始

### 1. 定义领域模型和服务

```typescript
import { Entity, Field, DomainLogic, Action, Inject } from '@ai-builder/dsl';
import type { Repo, EventBus } from '@ai-builder/dsl';

@Entity()
class Order {
  @Field({ type: 'string' })
  id?: string;

  @Field({ type: 'number' })
  amount: number = 0;
}

@DomainLogic()
class OrderService {
  // ✅ 使用 @Inject 声明依赖（不需要手动导入实现）
  @Inject('Repo<Order>')
  private orderRepo!: Repo<Order, string>;

  @Inject('EventBus')
  private eventBus!: EventBus;

  @Action()
  async createOrder(amount: number): Promise<Order> {
    const order = new Order();
    order.amount = amount;
    const saved = await this.orderRepo.save(order);
    
    await this.eventBus.publish({
      constructor: { name: 'OrderCreated' },
      orderId: saved.id
    });
    
    return saved;
  }
}
```

### 2. 启动 Runtime（自动装配）

```typescript
import { RuntimeBootstrap } from '@ai-builder/runtime';

// ✅ 一行代码完成所有组件自动装配
const runtime = RuntimeBootstrap.create({
  mode: 'simulation',
  services: [OrderService],  // 注册服务类
  repos: {
    'Order': 'InMemory'       // 配置实体 Repo
  }
});

// ✅ 获取服务实例（依赖已自动注入）
const orderService = runtime.get(OrderService);

// ✅ 直接使用
const order = await orderService.createOrder(100);
console.log(order.id, order.amount); // "1" 100
```

### 3. 在安全上下文中执行

```typescript
await runtime.runInContext(
  { userId: 'user-123', tenantId: 'tenant-456' },
  async () => {
    const service = runtime.get(OrderService);
    return service.createOrder(200);
  }
);
```

## 核心组件

### 1. RuntimeBootstrap（启动器）

自动装配并管理所有 Runtime 组件的生命周期。

**配置项**：
- `mode`: 运行模式（`'simulation'` | `'production'`）
- `services`: 服务类列表（自动扫描 `@Inject` 依赖）
- `repos`: Repo 配置（实体名 -> 实现类型）
- `container`: 自定义 IoC 容器（可选）

### 2. IocContainer（依赖注入容器）

轻量级 IoC 容器，支持：
- ✅ 自动依赖注入（基于 `@Inject` 元数据）
- ✅ 单例模式（默认）
- ✅ 类、工厂函数、实例三种注册方式
- ✅ 零外部依赖（100 行代码实现）

### 3. Runtime Primitives

| 组件 | 实现 | 说明 |
|------|------|------|
| `Decimal` | `decimal.js-light` | 高精度数值 |
| `Repo` | `InMemoryRepo` | 内存仓储（用于仿真） |
| `EventBus` | `LocalEventBus` | 本地事件总线（支持通配符） |
| `Hooks` | `HookRegistry` | 生命周期钩子 |
| `SecurityContext` | `ThreadLocalSecurityContext` | 安全上下文（基于 `AsyncLocalStorage`） |

## 高级用法

### 自定义 Repo 实现

```typescript
import { Repo } from '@ai-builder/dsl';

class PostgresOrderRepo implements Repo<Order, string> {
  // ... 实现 Repo 接口
}

const runtime = RuntimeBootstrap.create({
  repos: {
    'Order': PostgresOrderRepo  // 使用自定义实现
  }
});
```

### 访问底层容器

```typescript
const container = runtime.getContainer();

// 注册自定义服务
container.register('MyService', MyServiceImpl);

// 获取服务
const myService = container.get('MyService');
```

## 设计原则

1. **DSL-First**: 用户代码只依赖 `@ai-builder/dsl` 类型，不直接引用 Runtime 实现
2. **Auto-Wiring**: 通过 `RuntimeBootstrap` 启动时自动装配
3. **Pluggable**: 支持替换任意组件实现（Repo、EventBus 等）
4. **Simulatable**: 默认提供内存实现，可直接运行和测试

## 架构对比

**❌ 错误用法（直接引用）**：
```typescript
import { InMemoryRepo } from '@ai-builder/runtime'; // ❌ 用户代码不应直接引用

class OrderService {
  private orderRepo = new InMemoryRepo<Order>(); // ❌ 硬编码实现
}
```

**✅ 正确用法（自动装配）**：
```typescript
import { Inject } from '@ai-builder/dsl';
import type { Repo } from '@ai-builder/dsl'; // ✅ 只依赖接口

@DomainLogic()
class OrderService {
  @Inject('Repo<Order>')
  private orderRepo!: Repo<Order, string>; // ✅ 依赖注入
}

// 启动时配置
RuntimeBootstrap.create({
  services: [OrderService],
  repos: { 'Order': 'InMemory' } // 或 PostgresRepo
});
```

## 开发

```bash
# 构建
pnpm build

# 测试
pnpm test

# 类型检查
pnpm type-check
```

## License

MIT
