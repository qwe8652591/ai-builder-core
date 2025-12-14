# Research: UI DSL 层实现

**Phase**: 0 - Research | **Date**: 2025-12-07 | **Status**: 🔄 进行中

## 研究目标

为 UI DSL 层实现提供技术决策依据，包括：

1. 响应式系统的统一抽象设计
2. 组件模型的跨框架兼容方案
3. 标准 UI 组件协议的接口设计
4. TypeScript 类型系统的性能优化策略
5. 编译时转换的技术路径

## 1. 响应式系统设计模式

### 1.1 Vue 3 Reactivity API 分析

**核心原理**: 

- 基于 ES6 Proxy 实现响应式对象
- 使用 `WeakMap` 存储原始对象与响应式对象的映射
- 通过 `effect` 函数追踪依赖，建立 `target -> key -> Set<effect>` 的依赖图
- 使用 Scheduler 批量更新，避免重复执行

**关键 API**:

```typescript
// @vue/reactivity 核心 API
function ref<T>(value: T): Ref<T>;
function computed<T>(getter: () => T): ComputedRef<T>;
function watch<T>(source, callback, options?): StopHandle;
function effect(fn: () => void): ReactiveEffectRunner;
```

**特点**:
- ✅ 细粒度依赖追踪（只追踪实际访问的属性）
- ✅ 自动批量更新
- ✅ 支持 `.value` 读写统一语法
- ❌ 需要 Proxy 支持（IE11 不支持）

**研究结论**: 

TODO - 待完成

### 1.2 React Hooks 分析

**核心原理**:

- 基于 Fiber 架构和调度器实现
- 使用链表存储 Hook 状态（按调用顺序）
- 通过 `Object.is` 比较依赖数组决定是否重新执行
- 使用 Lane 模型实现优先级调度

**关键 API**:

```typescript
// React Hooks 核心 API
function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
function useMemo<T>(factory: () => T, deps: DependencyList): T;
function useEffect(effect: EffectCallback, deps?: DependencyList): void;
function useCallback<T extends Function>(callback: T, deps: DependencyList): T;
```

**特点**:
- ✅ 无需 Proxy，兼容性好
- ✅ 显式依赖数组，易于理解
- ❌ 需要手动声明依赖（容易遗漏）
- ❌ 必须遵守 Hook 调用规则（不能在循环/条件中调用）

**研究结论**:

TODO - 待完成

### 1.3 统一抽象设计方案

**设计目标**:

- 提供与 Vue 3 和 React 都兼容的 API 签名
- 尽可能保持 Vue 3 的简洁性（`.value` 语法）
- 支持编译时转换为目标框架的原生 API

**初步方案**:

```typescript
// UI DSL 统一 API
function useState<T>(initial: T): ReactiveState<T>; // 类似 Vue ref
function useComputed<T>(getter: () => T): ComputedState<T>; // 类似 Vue computed
function useWatch<T>(source, callback, options?): StopHandle; // 类似 Vue watch
function useEffect(effect, deps?): void; // 类似 React useEffect
```

**编译策略**:

TODO - 待完成

### 1.4 POC 验证

**测试代码**:

```typescript
// 示例：计数器组件
import { defineComponent, useState, useComputed } from '@ai-builder/dsl/ui';

export default defineComponent({}, () => {
  const count = useState(0);
  const doubled = useComputed(() => count.value * 2);

  const increment = () => {
    count.value++;
  };

  return () => (
    <div>
      <p>Count: {count.value}</p>
      <p>Doubled: {doubled.value}</p>
      <button onClick={increment}>+1</button>
    </div>
  );
});
```

**期望编译为 Vue 3**:

```typescript
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  setup() {
    const count = ref(0);
    const doubled = computed(() => count.value * 2);

    const increment = () => {
      count.value++;
    };

    return () => (
      <div>
        <p>Count: {count.value}</p>
        <p>Doubled: {doubled.value}</p>
        <button onClick={increment}>+1</button>
      </div>
    );
  }
});
```

**期望编译为 React**:

```typescript
import { useState, useMemo } from 'react';

export default function Component() {
  const [count, setCount] = useState(0);
  const doubled = useMemo(() => count * 2, [count]);

  const increment = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={increment}>+1</button>
    </div>
  );
}
```

**验证结果**:

TODO - 待完成

---

## 2. 组件模型对比分析

### 2.1 Vue 3 组件模型

**定义方式**:

```typescript
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    title: { type: String, required: true },
    count: { type: Number, default: 0 }
  },
  emits: ['update', 'delete'],
  setup(props, { emit, slots, attrs }) {
    // 逻辑
    return () => <div>{props.title}</div>;
  }
});
```

**特点**:
- Props 通过 `props` 选项声明类型和默认值
- Emits 通过 `emits` 选项声明事件
- 插槽通过 `slots` 访问
- 支持 `v-model` 双向绑定语法糖

### 2.2 React 组件模型

**定义方式**:

```typescript
import React from 'react';

interface Props {
  title: string;
  count?: number;
  onUpdate?: (value: number) => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

export default function Component({ title, count = 0, onUpdate, onDelete, children }: Props) {
  // 逻辑
  return <div>{title}</div>;
}
```

**特点**:
- Props 通过 TypeScript 接口定义
- 事件通过 `onXxx` 回调属性传递
- Children 通过特殊的 `children` prop 传递
- 双向绑定需要手动实现 `value + onChange`

### 2.3 统一抽象设计方案

**初步设计**:

```typescript
// UI DSL 统一组件定义
interface ComponentOptions<P = {}> {
  props?: PropDefinition<P>;
  emits?: EmitDefinition;
}

function defineComponent<P = {}>(
  options: ComponentOptions<P>,
  setup: (props: P, context: SetupContext) => RenderFunction
): Component<P>;
```

**编译策略**:

TODO - 待完成

---

## 3. UI 组件库 API 差异分析

### 3.1 Element Plus vs Ant Design 对比

#### 3.1.1 Table 组件

**Element Plus**:

```tsx
<el-table :data="tableData" :columns="columns">
  <el-table-column prop="name" label="姓名" />
  <el-table-column prop="age" label="年龄" />
</el-table>
```

**Ant Design**:

```tsx
<a-table :dataSource="tableData" :columns="columns" />
// columns 是配置对象数组，不使用插槽
```

**差异点**:
- Element Plus 使用插槽定义列，Ant Design 使用配置对象
- 分页器的位置和配置方式不同
- 选择行为的 API 不同（`selection-change` vs `rowSelection`）

**统一方案**:

TODO - 待完成

#### 3.1.2 Form 组件

**Element Plus**:

```tsx
<el-form :model="form" :rules="rules">
  <el-form-item label="用户名" prop="username">
    <el-input v-model="form.username" />
  </el-form-item>
</el-form>
```

**Ant Design**:

```tsx
<a-form :model="form" :rules="rules">
  <a-form-item label="用户名" name="username">
    <a-input v-model:value="form.username" />
  </a-form-item>
</a-form>
```

**差异点**:
- Element Plus 使用 `prop` 属性，Ant Design 使用 `name` 属性
- 双向绑定的语法不同（`v-model` vs `v-model:value`）
- 验证规则的格式基本一致（都遵循 async-validator）

**统一方案**:

TODO - 待完成

### 3.2 标准组件协议设计

**设计原则**:

1. **抽象核心能力**: 只定义 90% 场景使用的 Props，忽略边缘案例
2. **语义化命名**: 使用业务语义（如 `data` 而非 `dataSource`）
3. **类型优先**: 所有 Props 必须有明确的 TypeScript 类型
4. **可扩展性**: 通过 `nativeProps` 传递框架特定属性

**初步接口设计**:

```typescript
// 标准 Table 组件接口
interface TableProps<T = any> {
  data: T[];
  columns: ColumnDefinition<T>[];
  loading?: boolean;
  pagination?: PaginationConfig;
  selection?: ReactiveState<string[]>; // 双向绑定选中行
  onRowClick?: (row: T) => void;
  nativeProps?: Record<string, any>; // 透传原生属性
}

// 列定义
interface ColumnDefinition<T> {
  prop: keyof T;
  label: string;
  width?: string | number;
  formatter?: (value: any, row: T) => string;
  sortable?: boolean;
}
```

**映射配置格式**:

TODO - 待完成

---

## 4. TypeScript 类型系统设计

### 4.1 Vue 3 类型定义分析

**关键类型技巧**:

```typescript
// @vue/reactivity 中的类型定义
export interface Ref<T = any> {
  value: T;
  [RefSymbol]: true;
}

export type UnwrapRef<T> = T extends Ref<infer V>
  ? UnwrapRefSimple<V>
  : UnwrapRefSimple<T>;

// 递归展开响应式对象
type UnwrapRefSimple<T> = T extends
  | Function
  | CollectionTypes
  | BaseTypes
  | Ref
  | RefUnwrapBailTypes[keyof RefUnwrapBailTypes]
  ? T
  : T extends object
  ? { [K in keyof T]: UnwrapRefSimple<T[K]> }
  : T;
```

**学习要点**:
- 使用 Symbol 作为类型标记
- 递归类型需要设置终止条件（避免无限递归）
- 使用条件类型和 `infer` 推导泛型

### 4.2 React 类型定义分析

**关键类型技巧**:

```typescript
// @types/react 中的类型定义
export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];

// 函数组件类型
type FC<P = {}> = FunctionComponent<P>;
interface FunctionComponent<P = {}> {
  (props: P, context?: any): ReactElement<any, any> | null;
  propTypes?: WeakValidationMap<P>;
  defaultProps?: Partial<P>;
}
```

**学习要点**:
- 使用函数重载提供更精确的类型推导
- 泛型默认值 `S = undefined` 提升易用性
- 使用 `Dispatch` 类型包装 setState

### 4.3 UI DSL 类型设计策略

**设计目标**:

- 智能推导：`useState(0)` 自动推导为 `ReactiveState<number>`
- 泛型简洁：避免 `useState<number>(0)` 这种冗余写法
- 性能优化：限制递归深度，避免 TypeScript 编译器卡顿

**初步类型定义**:

```typescript
// 响应式状态类型
export interface ReactiveState<T> {
  readonly [ReactiveMarker]: true;
  get value(): T;
  set value(v: T);
}

// 计算属性类型
export interface ComputedState<T> {
  readonly [ComputedMarker]: true;
  readonly value: T;
}

// 类型守卫
export function isReactiveState<T>(val: any): val is ReactiveState<T> {
  return val && val[ReactiveMarker] === true;
}

// 智能推导的 useState
export function useState<T>(initialValue: T): ReactiveState<T>;
export function useState<T = undefined>(): ReactiveState<T | undefined>;
export function useState<T>(initialValue?: T): ReactiveState<T | undefined> {
  throw new Error('Runtime not implemented - this is a compile-time DSL');
}
```

**性能优化策略**:

TODO - 待完成

---

## 5. 性能优化策略

### 5.1 类型检查性能测试

**测试场景**:

- 小型项目（10 个页面，50 个组件）
- 中型项目（100 个页面，500 个组件）
- 大型项目（500 个页面，2000 个组件）

**性能指标**:

| 项目规模 | 文件数 | 类型检查时间 | IDE 响应时间 |
|---------|--------|--------------|--------------|
| 小型 | ~100 | TBD | TBD |
| 中型 | ~1000 | TBD | TBD |
| 大型 | ~5000 | TBD | TBD |

**瓶颈分析**:

TODO - 待完成

### 5.2 响应式系统性能优化

**优化技术**:

1. **浅层响应式**: 对于大型对象，只追踪第一层属性
2. **批量更新**: 使用 `nextTick` 或 `setTimeout` 批量执行更新
3. **懒计算**: 计算属性只在访问时才重新计算
4. **弱引用**: 使用 `WeakMap` 避免内存泄漏

**性能目标**:

- 1000 个状态 + 500 个计算属性，更新响应时间 < 16ms（60fps）
- 内存占用 < 100MB（对于 1000 个组件实例）

**测试结果**:

TODO - 待完成

---

## 6. 参考资料

### 官方文档

- [Vue 3 Composition API](https://vuejs.org/api/composition-api-setup.html)
- [React Hooks Reference](https://react.dev/reference/react)
- [Element Plus Components](https://element-plus.org/zh-CN/component/overview.html)
- [Ant Design Vue Components](https://antdv.com/components/overview-cn)

### 源码仓库

- [@vue/reactivity](https://github.com/vuejs/core/tree/main/packages/reactivity)
- [react-reconciler](https://github.com/facebook/react/tree/main/packages/react-reconciler)
- [Solid.js](https://github.com/solidjs/solid) - 类似的响应式框架
- [Svelte](https://github.com/sveltejs/svelte) - 编译时优化的框架

### 技术文章

- TODO - 添加相关技术文章链接

---

## 研究总结

### 关键发现

TODO - 待 1-5 节完成后填写

### 技术决策

TODO - 待研究完成后确定最终方案

### 待解决问题

TODO - 记录需要进一步澄清的问题

### 下一步行动

完成本研究文档后，进入 Phase 1 设计阶段：

1. 基于研究结论完善 `data-model.md`
2. 编写 `quickstart.md` 示例
3. 撰写详细的 API 契约文档（`contracts/`）
4. 在示例项目中创建 POC 验证

---

**研究负责人**: AI Assistant  
**审阅者**: TBD  
**完成日期**: 预计 2025-12-10





