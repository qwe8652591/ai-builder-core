# Service Decorators 恢复说明

## 📋 问题描述

`packages/dsl/src/decorators/service.ts` 文件在之前的操作中被意外删除，导致以下装饰器无法使用：

- `@DomainLogic`
- `@AppService`
- `@Service`
- `@Repository`
- `@Rule`

这导致项目中的 Repository 类无法使用 `@Repository` 装饰器，出现导入错误。

---

## ✅ 已完成的修复

### 1. **恢复 service.ts 文件**

重新创建了 `/packages/dsl/src/decorators/service.ts`，包含以下装饰器：

#### 🎯 装饰器说明

| 装饰器 | 用途 | 约束 | 示例 |
|--------|------|------|------|
| `@DomainLogic` | 领域逻辑类 | 纯函数、同步、静态方法 | 业务规则计算 |
| `@AppService` | 应用服务类 | 可访问 Repository 和 Service | 业务编排、API 暴露 |
| `@Service` | 内部服务类 | 可访问 Repository | 内部业务逻辑封装 |
| `@Repository` | 数据访问类 | 只负责数据持久化 | CRUD 操作 |
| `@Rule` | 业务规则方法 | 必须在 @DomainLogic 中 | 验证逻辑 |

#### 📝 代码示例

```typescript
// 领域逻辑
@DomainLogic()
export class OrderDomainLogic {
  @Action
  static calculateTotal(items: OrderItem[]): Decimal {
    return items.reduce((sum, item) => sum.add(item.amount), new Decimal(0));
  }
  
  @Rule
  static validateOrderNo(orderNo: string): void {
    if (!/^ORD\d{8}$/.test(orderNo)) {
      throw new Error('订单编号格式错误');
    }
  }
}

// 应用服务
@AppService()
export class OrderAppService {
  constructor(
    private orderRepo: OrderRepository,
    private orderLogic: OrderDomainLogic
  ) {}
  
  async createOrder(cmd: CreateOrderCmd): Promise<OrderVO> {
    // 业务编排逻辑
  }
}

// 内部服务
@Service()
export class OrderService {
  async calculateShippingFee(order: Order): Promise<Decimal> {
    // 内部业务逻辑
  }
}

// 数据访问层
@Repository()
export class OrderRepository {
  async findById(id: string): Promise<Order | null> {
    // 数据访问逻辑
  }
}
```

---

### 2. **修复类型错误**

修复了装饰器中的 TypeScript 类型错误：

#### 修复前
```typescript
export function Repository() {
  return function <T extends Constructor>(target: T, context: ClassDecoratorContext) {
    metadataStore.registerEntity(context.name, {  // ❌ context.name 可能为 undefined
      type: 'repository',
      className: context.name,
    });
    return target;
  };
}
```

#### 修复后
```typescript
export function Repository() {
  return function <T extends Constructor>(target: T, context: ClassDecoratorContext) {
    const className = String(context.name);  // ✅ 确保为 string
    metadataStore.registerEntity(className, {
      type: 'repository',
      className: className,
    });
    return target;
  };
}
```

---

### 3. **恢复 Repository 装饰器使用**

在以下文件中恢复了 `@Repository()` 装饰器的使用：

#### Product.repository.ts
```typescript
import { Repository } from '@ai-builder/dsl';

@Repository()
export class ProductRepository extends MetadataBaseRepository<Product> {
  // ...
}
```

#### PurchaseOrder.repository.ts
```typescript
import { Repository } from '@ai-builder/dsl';

@Repository()
export class PurchaseOrderRepository extends MetadataBaseRepository<PurchaseOrder> {
  // ...
}
```

---

## 🔧 技术细节

### 装饰器实现原理

使用 TypeScript 5.0+ 的标准装饰器（Stage 3）：

```typescript
export function Repository() {
  return function <T extends Constructor>(target: T, context: ClassDecoratorContext) {
    // 1. 获取类名
    const className = String(context.name);
    
    // 2. 注册到 metadataStore
    metadataStore.registerEntity(className, {
      type: 'repository',
      className: className,
    });
    
    // 3. 返回原类（不修改）
    return target;
  };
}
```

### 元数据存储

所有装饰器都会将信息注册到 `metadataStore`：

```typescript
// 存储结构
metadataStore.entities: Map<string, {
  type: 'domainLogic' | 'appService' | 'service' | 'repository',
  className: string,
}>

metadataStore.methods: Map<string, Map<string, {
  type: 'rule' | 'action',
  methodName: string,
}>>
```

---

## 📊 验证清单

- [x] `service.ts` 文件已恢复
- [x] 所有装饰器已实现
  - [x] `@DomainLogic`
  - [x] `@AppService`
  - [x] `@Service`
  - [x] `@Repository`
  - [x] `@Rule`
- [x] 类型错误已修复
- [x] `decorators/index.ts` 已导出
- [x] `dsl/src/index.ts` 已导出
- [x] Repository 文件已更新使用 `@Repository`
- [x] 通过 ESLint 检查（无错误）

---

## 🎯 架构约束（ESLint 规则）

这些装饰器配合 `@ai-builder/eslint-plugin` 可以强制执行架构约束：

| 层级 | 装饰器 | 可以调用 | 禁止调用 |
|------|--------|----------|----------|
| **Domain** | `@DomainLogic` | - | 所有外部依赖（纯函数） |
| **Application** | `@AppService` | Repository, Service, DomainLogic | 直接数据库操作 |
| **Infrastructure** | `@Service` | Repository, DomainLogic | 其他 Service, AppService |
| **Repository** | `@Repository` | - | Service, AppService, 业务逻辑 |

---

## 🚀 使用建议

### 1. **领域驱动设计（DDD）分层**

```
@DomainLogic        ← 纯业务逻辑（同构）
      ↑
@AppService         ← 业务编排 + API 暴露
      ↑
@Service            ← 内部服务（不暴露）
      ↑
@Repository         ← 数据访问
```

### 2. **装饰器选择指南**

- 需要暴露 HTTP API？使用 `@AppService`
- 内部业务逻辑封装？使用 `@Service`
- 纯计算/验证逻辑？使用 `@DomainLogic`
- 数据库操作？使用 `@Repository`

### 3. **最佳实践**

```typescript
// ✅ 好的实践
@Repository()
export class UserRepository extends MetadataBaseRepository<User> {
  async findByEmail(email: string): Promise<User | null> {
    // 只做数据查询，不包含业务逻辑
  }
}

@Service()
export class UserService {
  constructor(private userRepo: UserRepository) {}
  
  async registerUser(email: string): Promise<User> {
    // 1. 业务逻辑：检查邮箱是否存在
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new Error('邮箱已存在');
    
    // 2. 调用 Repository
    return await this.userRepo.create({ email, ... });
  }
}

@AppService()
export class UserAppService {
  constructor(private userService: UserService) {}
  
  @Expose('/api/users')  // 暴露 API
  async register(cmd: RegisterUserCmd): Promise<UserVO> {
    // 编排业务流程
    const user = await this.userService.registerUser(cmd.email);
    // 发送欢迎邮件
    await this.emailService.sendWelcome(user.email);
    return user;
  }
}

// ❌ 不好的实践
@Repository()
export class UserRepository {
  async registerUser(email: string): Promise<User> {
    // ❌ Repository 不应该包含业务逻辑
    const existing = await this.findByEmail(email);
    if (existing) throw new Error('邮箱已存在');
    return await this.create({ email });
  }
}
```

---

## 📝 总结

`service.ts` 文件已成功恢复，包含了完整的服务层装饰器定义。这些装饰器是实现 **Type-First MDA** 架构的重要组成部分，配合 ESLint 规则可以强制执行清晰的分层架构。

所有相关文件都已更新并通过 ESLint 检查，项目可以正常使用这些装饰器了！🎉

