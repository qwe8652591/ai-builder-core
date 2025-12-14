# @qwe8652591/eslint-plugin

ESLint plugin for AI Builder DSL syntax constraints.

强制执行分层架构规范，确保代码符合 MDA (模型驱动架构) 设计原则。

## Installation

```bash
pnpm add -D @qwe8652591/eslint-plugin @typescript-eslint/parser
```

## Usage

Add to your `.eslintrc.js`:

```js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@ai-builder'],
  extends: ['plugin:@ai-builder/recommended'],
};
```

## Rules

### 领域层规则 (Domain Layer)

#### `no-async-in-domain`

🛑 禁止在 `.domain.ts` 文件中使用 `async/await`。

**原因**: 领域逻辑必须是纯同步的，以支持前后端同构执行。

**示例**:

```typescript
// ❌ 错误
@DomainLogic()
export class OrderDomain {
  static async calculateTotal(items: OrderItem[]): Promise<Decimal> { // ❌
    return items.reduce(...);
  }
}

// ✅ 正确
@DomainLogic()
export class OrderDomain {
  static calculateTotal(items: OrderItem[]): Decimal { // ✅
    return items.reduce(...);
  }
}
```

---

#### `no-this-in-domain`

🛑 禁止在 `.domain.ts` 文件中使用 `this`。

**原因**: 所有方法应该是静态方法，确保无状态。

**示例**:

```typescript
// ❌ 错误
@DomainLogic()
export class OrderDomain {
  calculateTotal(items: OrderItem[]): Decimal {
    return this.sum(items); // ❌ 使用了 this
  }
}

// ✅ 正确
@DomainLogic()
export class OrderDomain {
  static calculateTotal(items: OrderItem[]): Decimal { // ✅ 静态方法
    return OrderDomain.sum(items);
  }
}
```

---

### 模型层规则 (Model Layer)

#### `model-fields-only`

🛑 禁止在 `.model.ts` 文件中定义方法。

**原因**: Model 文件只能包含字段定义和装饰器。

**示例**:

```typescript
// ❌ 错误
@Entity()
export class Order {
  @Field()
  orderNo: string;
  
  calculateTotal() { // ❌ 不能有方法
    return this.totalAmount;
  }
}

// ✅ 正确
@Entity()
export class Order {
  @Field()
  orderNo: string;
  
  @Field()
  totalAmount: Decimal; // ✅ 只有字段定义
}
```

---

#### `no-async-in-model`

🛑 禁止在 `.model.ts` 文件中使用 `async/await`。

**原因**: Model 只能是纯数据定义。

---

### 应用服务层规则 (Application Service Layer)

#### `use-inject-decorator`

⚠️ 在 `.app.ts` / `.service.ts` / `.repository.ts` 文件中，服务依赖应该使用 `@Inject` 装饰器标注。

**示例**:

```typescript
// ⚠️ 警告
@AppService()
export class OrderAppService {
  private orderService: OrderService; // ⚠️ 缺少 @Inject
  private orderRepository: OrderRepository; // ⚠️ 缺少 @Inject
}

// ✅ 正确
@AppService()
export class OrderAppService {
  @Inject()
  private orderService: OrderService; // ✅
  
  @Inject()
  private orderRepository: OrderRepository; // ✅
}

// 也适用于 @Service 和 @Repository
@Service()
export class OrderService {
  @Inject()
  private repository: OrderRepository; // ✅
}

@Repository()
export class OrderRepository {
  @Inject()
  private repo: Repo<Order, string>; // ✅
}
```

---

#### `action-return-type`

🛑 `@Action` 装饰的方法必须显式声明返回类型。

**原因**: 确保类型安全和代码生成的准确性。

**示例**:

```typescript
// ❌ 错误
@AppService()
export class OrderAppService {
  @Action()
  async createOrder(cmd: CreateOrderDTO) { // ❌ 缺少返回类型
    // ...
  }
}

// ✅ 正确
@AppService()
export class OrderAppService {
  @Action()
  async createOrder(cmd: CreateOrderDTO): Promise<string> { // ✅
    // ...
  }
}
```

---

### 内部服务层规则 (Internal Service Layer)

#### `no-expose-in-service`

🛑 `@Service` 和 `@Repository` 不应该使用 `@Expose` 装饰器。

**原因**: 只有 `@AppService` 可以暴露 API，内部服务和仓储层不应该直接暴露。

**示例**:

```typescript
// ❌ 错误: @Service 使用了 @Expose
@Service()
export class OrderService {
  @Action()
  @Expose({ method: 'GET', path: '/orders' }) // ❌
  async findOrders(): Promise<Order[]> {
    // ...
  }
}

// ❌ 错误: @Repository 使用了 @Expose
@Repository()
export class OrderRepository {
  @Expose({ method: 'GET', path: '/orders' }) // ❌
  async findAll(): Promise<Order[]> {
    // ...
  }
}

// ✅ 正确: 只在 @AppService 中使用 @Expose
@AppService()
@Expose()
export class OrderAppService {
  @Inject()
  private orderService: OrderService;
  
  @Action()
  @Expose({ method: 'GET', path: '/orders' }) // ✅
  async getOrders(): Promise<OrderDTO[]> {
    return await this.orderService.findOrders();
  }
}

// ✅ 正确: @Service 不使用 @Expose
@Service()
export class OrderService {
  async findOrders(): Promise<Order[]> { // ✅ 不暴露 API
    // ...
  }
}
```

---

### 视图层规则 (View Layer)

#### `use-define-page`

🛑 `.view.tsx` 文件必须使用 `definePage` 或 `defineComponent` 定义页面/组件。

**原因**: 确保视图层使用标准的 DSL 定义方式。

**示例**:

```typescript
// ❌ 错误
export default function OrderListPage() { // ❌ 普通函数
  return <div>...</div>;
}

// ✅ 正确
export default definePage({ // ✅
  route: '/orders',
  title: '订单列表'
}, () => {
  return () => <div>...</div>;
});
```

---

#### `no-side-effect-in-render`

🛑 禁止在 render 函数中产生副作用。

**原因**: render 函数应该是纯函数，副作用应放在 `useEffect` 或事件处理函数中。

**示例**:

```typescript
// ❌ 错误
export default definePage({...}, () => {
  const orders = useState([]);
  
  return () => (
    <div>
      {orders.value = fetchOrders()} {/* ❌ render 中修改状态 */}
    </div>
  );
});

// ✅ 正确
export default definePage({...}, () => {
  const orders = useState([]);
  
  useEffect(async () => { // ✅ 副作用放在 useEffect
    orders.value = await fetchOrders();
  }, []);
  
  return () => (
    <div>{orders.value.map(...)}</div>
  );
});
```

---

### 跨层约束规则 (Cross-Layer Constraints)

#### `no-restricted-imports-in-layer`

🛑 强制执行分层架构的引用约束。

**分层引用约束矩阵**:

```
引用方 ↓ / 被引用方 →   .model.ts   .domain.ts   .app.ts   .view.tsx
───────────────────────────────────────────────────────────────────
.model.ts                 ✅ 同层      ❌ 禁止      ❌ 禁止    ❌ 禁止
.domain.ts                ✅ 可引用    ✅ 同层      ❌ 禁止    ❌ 禁止
.app.ts                   ✅ 可引用    ✅ 可引用    ✅ 同层    ❌ 禁止
.view.tsx                 ✅ 可引用    ✅ 可引用    ✅ 可引用  ✅ 同层
```

**额外约束**:

- **Domain 层禁止**:
  - ❌ 引用数据访问层 (`/dal/`, `/repo/`, `/mapper/`)
  - ❌ HTTP 请求 (`axios`, `node-fetch`, `got`)
  - ❌ 文件/系统操作 (`fs`, `path`, `child_process`)

- **App 层禁止**:
  - ❌ 引用前端框架 (`vue`, `react`, `@vue/*`)

- **View 层禁止**:
  - ❌ 直接访问数据库 (`/dal/`, `/repo/`, `/mapper/`)

**示例**:

```typescript
// ❌ 错误: Model 层引用 Domain 层
// Order.model.ts
import { OrderDomain } from './Order.domain'; // ❌

// ❌ 错误: Domain 层引用 App 层
// Order.domain.ts
import { OrderAppService } from './Order.app'; // ❌

// ❌ 错误: Domain 层进行 HTTP 请求
// Order.domain.ts
import axios from 'axios'; // ❌

// ❌ 错误: View 层直接访问数据库
// OrderList.view.tsx
import { OrderRepository } from '../dal/Order.repository'; // ❌

// ✅ 正确: App 层可以引用 Model 和 Domain
// Order.app.ts
import { Order } from './Order.model'; // ✅
import { OrderDomain } from './Order.domain'; // ✅
```

---

## 完整配置示例

```js
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', '@ai-builder'],
  extends: ['plugin:@ai-builder/recommended'],
  
  // 针对不同文件类型的覆盖配置
  overrides: [
    // .model.ts 文件
    {
      files: ['**/*.model.ts'],
      rules: {
        '@ai-builder/model-fields-only': 'error',
        '@ai-builder/no-async-in-model': 'error',
      }
    },
    
    // .domain.ts 文件
    {
      files: ['**/*.domain.ts'],
      rules: {
        '@ai-builder/no-async-in-domain': 'error',
        '@ai-builder/no-this-in-domain': 'error',
      }
    },
    
    // .app.ts 文件 (应用服务层)
    {
      files: ['**/*.app.ts'],
      rules: {
        '@ai-builder/use-inject-decorator': 'warn',
        '@ai-builder/action-return-type': 'error',
      }
    },
    
    // .service.ts 文件 (内部服务层)
    {
      files: ['**/*.service.ts'],
      rules: {
        '@ai-builder/use-inject-decorator': 'warn',
        '@ai-builder/action-return-type': 'error',
        '@ai-builder/no-expose-in-service': 'error',
      }
    },
    
    // .repository.ts 文件 (仓储层)
    {
      files: ['**/*.repository.ts'],
      rules: {
        '@ai-builder/use-inject-decorator': 'warn',
        '@ai-builder/no-expose-in-service': 'error',
      }
    },
    
    // .view.tsx 文件
    {
      files: ['**/*.view.tsx'],
      rules: {
        '@ai-builder/use-define-page': 'error',
        '@ai-builder/no-side-effect-in-render': 'error',
      }
    },
  ],
};
```

---

## 规则严重性

- 🛑 **error**: 必须遵守，违反会导致编译失败
- ⚠️ **warn**: 建议遵守，违反会给出警告

---

## 规则列表总览

| 规则 | 适用文件 | 严重性 | 说明 |
|------|---------|--------|------|
| `no-async-in-domain` | `.domain.ts` | 🛑 error | 禁止 async/await |
| `no-this-in-domain` | `.domain.ts` | 🛑 error | 禁止使用 this |
| `model-fields-only` | `.model.ts` | 🛑 error | 只允许字段定义 |
| `no-async-in-model` | `.model.ts` | 🛑 error | 禁止 async/await |
| `use-inject-decorator` | `.app.ts`, `.service.ts`, `.repository.ts` | ⚠️ warn | 使用 @Inject 标注依赖 |
| `action-return-type` | 所有文件 | 🛑 error | @Action 必须有返回类型 |
| `no-expose-in-service` | `.service.ts`, `.repository.ts` | 🛑 error | @Service/@Repository 不能使用 @Expose |
| `use-define-page` | `.view.tsx` | 🛑 error | 使用 definePage |
| `no-side-effect-in-render` | `.view.tsx` | 🛑 error | render 中禁止副作用 |
| `no-restricted-imports-in-layer` | 所有文件 | 🛑 error | 强制分层引用约束 |

---

## License

MIT




