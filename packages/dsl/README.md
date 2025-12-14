# @ai-builder/dsl

AI Builder 的核心 DSL 定义包，提供基于 TypeScript 装饰器的领域建模能力。

## 特性

- **零运行时逻辑**：装饰器仅作为类型标记和编译期元数据源，运行时开销极低。
- **强类型推断**：利用 TypeScript 5.0+ 高级类型，自动推断 DTO、查询参数和事件类型。
- **同构业务逻辑**：支持编写可同时运行在 Node.js (后端) 和浏览器 (前端/仿真) 的业务逻辑。
- **标准化**：完全遵循 ECMAScript Stage 3 Decorators 标准。

## 安装

```bash
pnpm add @ai-builder/dsl
```

要求 `typescript >= 5.0` 并在 `tsconfig.json` 中配置：

```json
{
  "compilerOptions": {
    "experimentalDecorators": false,
    "useDefineForClassFields": true
  }
}
```

## 快速开始

### 1. 定义实体

```typescript
import { Entity, Field, Validation } from '@ai-builder/dsl';

@Entity({ table: 'users', comment: '用户表' })
export class User {
  @Field({ label: 'ID' })
  id: number = 0;

  @Field({ label: '用户名' })
  @Validation({ required: true, max: 50 })
  username: string = '';
}
```

### 2. 定义业务逻辑

```typescript
import { DomainLogic, Action } from '@ai-builder/dsl';
import { Decimal } from '@ai-builder/dsl/primitives';

@DomainLogic()
export class OrderLogic {
  @Action()
  calculateTotal(price: Decimal, quantity: number): Decimal {
    return price.mul(quantity);
  }
}
```

### 3. 派生 DTO

```typescript
import { CreateCommand, View } from '@ai-builder/dsl/types';
import { User } from './models/user';

// 自动生成 { username: string } 类型 (排除 id)
export type CreateUserCmd = CreateCommand<User>;

// 自动生成视图类型
export type UserVo = View & User;
```

## 模块说明

- `@ai-builder/dsl/decorators`: 核心装饰器 (Entity, Field, Action...)
- `@ai-builder/dsl/types`: 类型工具 (Command, View, PageParam...)
- `@ai-builder/dsl/primitives`: 运行时原语接口 (Decimal, Repo, EventBus...)

## License

MIT
