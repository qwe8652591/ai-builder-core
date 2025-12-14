# 调研报告: @ai-builder/runtime 技术选型

**分支**: `002-runtime-core`
**日期**: 2025-12-07

## 1. Decimal 实现库选型

### 选项 A: `decimal.js-light`
- **大小**: ~12KB (minified)
- **特性**: 支持高精度算术、对数、指数等科学计算。API 丰富。
- **优点**: 功能全面，文档完善，社区活跃。
- **缺点**: 相对 `big.js` 稍大。

### 选项 B: `big.js`
- **大小**: ~6KB (minified)
- **特性**: 仅支持基本算术（加减乘除、比较、绝对值）。
- **优点**: 极小，足以满足 90% 的业务场景（金额计算）。
- **缺点**: 缺乏高级数学函数（如果未来 DSL 需要 `pow`, `log` 等可能会受限）。

### 决策
**选择: `decimal.js-light`**

**理由**:
虽然 `big.js` 更小，但考虑到 DSL 可能需要支持更广泛的业务逻辑（不仅是简单的金额加减），`decimal.js-light` 提供了更好的扩展性，且 12KB 的体积在服务端运行时（Node.js）完全可以接受。它提供了更符合直觉的 API，且与 Java `BigDecimal` 的功能对齐度更高。

---

## 2. EventBus 库选型

### 选项 A: `mitt`
- **大小**: < 200 bytes
- **特性**: 极简 API (`on`, `off`, `emit`)。
- **通配符支持**: 默认不支持。有一个 `mitt/wildcard` 变体，或者可以通过拦截所有事件来实现。
- **优点**: 极小，无依赖。

### 选项 B: `eventemitter2`
- **大小**: ~4KB
- **特性**: 原生支持通配符 (`foo.*`)、命名空间、TTL 等丰富功能。
- **优点**: 功能强大，完全满足复杂事件路由需求。
- **缺点**: 相对较大，对于简单的仿真环境可能过重。

### 选项 C: 自研 `LocalEventBus`
- **大小**: < 1KB
- **特性**: 仅实现 DSL `EventBus` 接口所需的 `publish`, `subscribe` (含通配符)。
- **优点**: 完全贴合接口，无冗余代码，无外部依赖。

### 决策
**选择: 自研 `LocalEventBus` (参考 `mitt` 实现)**

**理由**:
DSL 定义的 `EventBus` 接口非常简单。为了支持通配符订阅（这是 DDD 常见需求），引入 `eventemitter2` 有点大材小用，而 `mitt` 需要 hack 才能支持。我们可以写一个简单的 Map + Regex 或前缀匹配的实现，代码量很小，且完全可控，符合 "Zero Runtime Magic" 的精神（我们可以清楚地看到它是如何工作的）。

---

## 3. RepoFactory 设计模式

### 需求
用户在编写 Service 时需要获取 `Repo<User>`。在仿真环境中，我们需要注入 `InMemoryRepo`。

### 选项 A: 依赖注入容器 (DI Container)
- 引入 `inversify` 或 `tsyringe`。
- **缺点**: 引入了显著的运行时复杂度和依赖。违背了轻量级原则。

### 选项 B: 静态工厂/注册表 (Static Registry)
- 提供 `RepoFactory.register(Entity, RepoInstance)` 和 `RepoFactory.get(Entity)`。
- **优点**: 简单，易于理解，易于测试。
- **缺点**: 全局状态，并行测试可能需要重置。

### 决策
**选择: 静态注册表 (MetadataStore 驱动)**

**理由**:
我们已经有一个 `MetadataStore` 用于存储装饰器元数据。我们可以利用它或类似的机制。
实现一个简单的 `RepoRegistry`：
```typescript
class RepoRegistry {
  private static repos = new Map<string, Repo<any>>();
  
  static register<T>(entityClass: Class<T>, repo: Repo<T>) { ... }
  static get<T>(entityClass: Class<T>): Repo<T> { ... }
}
```
结合 `InMemoryRepo` 的自动创建：如果请求一个未注册的 Repo，工厂可以自动创建一个新的 `InMemoryRepo` 并注册它。这样用户甚至不需要手动注册，直接 `RepoFactory.get(User)` 就能用，极大地提升了 "Simulatable" 体验。

---

## 4. SecurityContext 实现

### 决策
使用 Node.js 原生 **`AsyncLocalStorage`**。

**理由**:
这是在异步调用链中传递上下文的标准现代方式，性能好且无外部依赖。我们将把它封装在 `ThreadLocalSecurityContext` 类中，以匹配 DSL 接口。

---

## 总结

- **Decimal**: `decimal.js-light`
- **EventBus**: 自研轻量级实现 (支持通配符)
- **Repo**: `InMemoryRepo` + 自动注册工厂
- **Security**: `AsyncLocalStorage`






