# @ai-builder/dsl 快速开始

本指南将帮助你快速上手使用 `@ai-builder/dsl` 定义领域模型和业务逻辑。

## 1. 安装

由于 `@ai-builder/dsl` 是一个纯类型定义和装饰器包，你需要确保 TypeScript 版本 >= 5.0。

```bash
pnpm add @ai-builder/dsl
```

在 `tsconfig.json` 中确保启用标准装饰器：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    // "experimentalDecorators": false, // 确保关闭旧版装饰器（TS 5.0+ 默认行为）
  }
}
```

## 2. 定义数据模型

使用 `Entity` 和 `Field` 定义你的领域实体。

`src/models/user.ts`:

```typescript
import { Entity, Field, Validation } from '@ai-builder/dsl';

@Entity({ table: 'sys_user', comment: '系统用户' })
export class User {
  @Field({ label: 'ID' })
  id: string;

  @Field({ label: '用户名' })
  @Validation({ required: true, minLength: 4, maxLength: 20 })
  username: string;

  @Field({ label: '邮箱' })
  @Validation({ email: true, message: '请输入有效的邮箱地址' })
  email: string;

  @Field({ label: '年龄', nullable: true })
  @Validation({ min: 0, max: 150 })
  age?: number;

  @Field({ label: '激活状态', defaultValue: true })
  active: boolean = true;
}
```

## 3. 定义关联关系

使用 `Composition` 和 `Association` 定义实体间的关系。

`src/models/order.ts`:

```typescript
import { Entity, Field, Composition, Association } from '@ai-builder/dsl';
import { User } from './user';

@Entity({ comment: '订单明细' })
export class OrderItem {
  @Field({ label: '商品名称' })
  productName: string;

  @Field({ label: '数量' })
  quantity: number;
}

@Entity({ comment: '订单' })
export class Order {
  @Field({ label: '订单号' })
  orderNo: string;

  // 多对一关联：订单属于用户
  @Association({ target: () => User, type: 'ManyToOne', label: '下单用户' })
  user: User;

  // 一对多组合：订单包含多个明细
  @Composition({ target: () => OrderItem, type: 'OneToMany', label: '订单明细' })
  items: OrderItem[];
}
```

## 4. 派生 DTO 类型

使用类型工具快速生成 DTO，避免重复定义。

`src/dtos/user-dto.ts`:

```typescript
import { CreateCommand, UpdateCommand, PageResult, DetailView } from '@ai-builder/dsl/types';
import { User } from '../models/user';

// 自动生成：{ username: string; email: string; age?: number; active?: boolean }
export type CreateUserCmd = CreateCommand<User>;

// 自动生成：{ id: any; username?: string; ... }
export type UpdateUserCmd = UpdateCommand<User>;

// 自动生成：User 的所有字段
export type UserVo = DetailView<User>;

// 分页结果类型
export type UserPage = PageResult<UserVo>;
```

## 5. 编写业务逻辑

使用服务装饰器和运行时原语编写逻辑。

`src/services/order-service.ts`:

```typescript
import { DomainLogic, Action, Inject } from '@ai-builder/dsl';
import { Decimal, Repo } from '@ai-builder/dsl/primitives';
import { Order } from '../models/order';

@DomainLogic
export class OrderService {
  // 注入仓储（类型安全）
  @Inject()
  private orderRepo: Repo<Order>;

  @Action({ transactional: true })
  async createOrder(items: { price: number; quantity: number }[]) {
    // 使用高精度数值计算
    let total = Decimal.ZERO;
    
    for (const item of items) {
      const price = new Decimal(item.price);
      const quantity = new Decimal(item.quantity);
      total = total.add(price.mul(quantity));
    }

    // ... 保存逻辑
    return total.toNumber();
  }
}
```

## 6. 下一步

- 运行 `tsc` 检查类型错误
- 使用 `@ai-builder/cli` (即将推出) 解析 DSL 并生成代码






