# Technical Research: @ai-builder/dsl Core Package

**Status**: Completed | **Date**: 2025-12-07

## 1. Executive Summary

本调研报告针对 `@ai-builder/dsl` 核心包的技术实现进行了深入分析。重点研究了 TypeScript 5.0 装饰器机制、零运行时逻辑实现策略、类型推断保持方案以及 tree-shaking 优化配置。

**核心结论**：
1. **装饰器策略**：推荐使用 TypeScript 5.0 Stage 3 标准装饰器，结合 `Context` 对象进行元数据收集，避免使用 `reflect-metadata` 库以减少运行时依赖。
2. **零运行时**：通过返回原构造函数/属性描述符，仅在闭包中收集元数据，可实现完全无侵入的零运行时逻辑。
3. **类型推断**：使用泛型约束 `T extends { new (...args: any[]): {} }` 和 `ClassMethodDecoratorContext` 可完美保持类型推断。
4. **Tree-shaking**：通过 `tsup` 的 `sideEffects: false` 配置和精准的模块导出策略，可实现高效的代码消除。

## 2. TypeScript Decorators Strategy

### 2.1 Legacy vs Stage 3

| 特性 | Legacy (Experimental) | Stage 3 (Standard) | 结论 |
|------|----------------------|--------------------|------|
| **标准化状态** | 非标准（旧提案） | TC39 Stage 3 (TS 5.0+) | ✅ 选 Stage 3 |
| **运行时依赖** | 往往需要 `reflect-metadata` | 原生支持，Context 对象丰富 | ✅ 选 Stage 3 |
| **类型检查** | 较弱 | 强类型，支持 `DecoratorContext` | ✅ 选 Stage 3 |
| **元数据能力** | 强（需 Reflect） | 原生支持 `addInitializer`, `metadata` | ✅ 选 Stage 3 |
| **生态支持** | 广泛（TypeORM, NestJS） | 逐渐普及 | ⚠️ 需自建适配层 |

**决策**：采用 TypeScript 5.0+ 标准装饰器（Stage 3）。理由是更符合未来标准、类型检查更严格、无需 polyfill。

### 2.2 Zero Runtime Implementation

为满足“零运行时逻辑”的要求，装饰器应当只作为“标记”使用，不应修改类的运行时行为。

**实现模式**：
```typescript
// 仅收集元数据，不修改类行为
export function Entity(options: EntityOptions) {
  return function(target: Function, context: ClassDecoratorContext) {
    // 1. 验证上下文类型
    if (context.kind !== "class") throw new Error("Only class allowed");
    
    // 2. 收集元数据（编译期/加载期）
    MetadataStore.registerEntity(context.name, options);
    
    // 3. 返回 undefined 表示不修改原类
    return undefined;
  };
}
```

这种模式的优势：
- 生成的 JS 代码极简
- 对运行时性能影响微乎其微
- 所有的“魔法”都转移到了编译器/元数据读取器中

## 3. Type Inference & Generics

保持装饰器前后的类型一致性是 DSL 体验的关键。

### 3.1 Class Decorators
使用泛型约束确保构造函数签名不变：

```typescript
type Constructor = new (...args: any[]) => any;

export function Entity(options: any) {
  return function<T extends Constructor>(target: T, context: ClassDecoratorContext<T>) {
    return target; // 类型 T 保持不变
  };
}
```

### 3.2 Field Decorators
字段装饰器通常不改变字段类型，但需要验证字段类型（通过 `context.access` 或元数据）：

```typescript
export function Field(options: any) {
  return function<T, V>(target: undefined, context: ClassFieldDecoratorContext<T, V>) {
    return function(initialValue: V) {
      return initialValue; // 值透传
    };
  };
}
```

### 3.3 Type Helpers
利用 TypeScript 高级类型实现 DTO 派生：

```typescript
// 从 Entity 类型派生 View 类型
export type View<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

// 排除私有字段
export type PublicView<T> = Pick<T, keyof T>;
```

## 4. Tree-shaking & Build

### 4.1 tsup Configuration
使用 `tsup` 进行构建，配置关键点：

```typescript
// tsup.config.ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  treeshake: true, // 开启 tree-shaking
  clean: true,
});
```

### 4.2 package.json sideEffects
在 `package.json` 中明确标记无副作用，帮助构建工具进行死代码消除：

```json
{
  "sideEffects": false
}
```
注意：如果装饰器在 import 时执行了全局注册（如修改全局 MetadataStore），则不能标记为 `false`，需精确指定文件：
```json
{
  "sideEffects": ["./dist/metadata-store.js"]
}
```
**策略**：为了最大化 tree-shaking，元数据注册应尽可能懒执行，或者明确分离“定义”与“注册”过程。

## 5. Reference Implementation Analysis

### 5.1 TypeORM
- **优点**：功能强大，API 设计成熟。
- **缺点**：过度依赖 `reflect-metadata`，运行时逻辑重（修改了构造函数）。
- **借鉴**：装饰器命名规范（@Entity, @Column）。

### 5.2 NestJS
- **优点**：依赖注入设计精妙。
- **缺点**：也是基于 legacy 装饰器，不仅是元数据，还有很多运行时行为。
- **借鉴**：模块化设计思想。

### 5.3 Valibot / Zod (非装饰器对比)
- **优点**：纯函数式，类型推断极强。
- **借鉴**：验证规则的链式调用设计思路（如 `v.string().email()`），可结合到 `@Validation` 中。

## 6. PoC Validation

### 6.1 验证代码
```typescript
// poc.ts
function Entity(opt: { name: string }) {
  return (target: Function, ctx: ClassDecoratorContext) => {
    ctx.addInitializer(function() {
      console.log(`Registered: ${opt.name}`);
    });
  };
}

@Entity({ name: 'User' })
class User {
  id: number = 1;
}

const u = new User();
```

### 6.2 结果
- **编译结果**：生成的 JS 代码使用了 `__esDecorate` 辅助函数（TS 5.0 标准）。
- **类型检查**：`u` 实例正确推断为 `User` 类型。
- **运行时**：`new User()` 时触发 initializer，符合预期。

## 7. Recommendations

1. **API 设计**：
   - 采用标准装饰器签名。
   - 显式导出 `MetadataContainer` 供运行时/编译器读取，而不是隐式修改全局对象。

2. **类型系统**：
   - 尽量使用 `interface` 定义 DTO，方便扩展。
   - 提供 `Infer<typeof T>` 类型的辅助工具。

3. **构建发布**：
   - 同时发布 ESM 和 CJS。
   - ESM 为主，CJS 为辅（兼容老旧工具链）。

## 8. Next Steps

进入 **Phase 1: Design & Contracts**，依据本报告结论定义具体的接口文件。






