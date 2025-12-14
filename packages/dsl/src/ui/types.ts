/**
 * UI DSL 核心类型定义
 * 
 * 本文件定义 UI DSL 的公共类型、Symbol 标记和基础接口。
 * 这些类型是响应式系统、组件模型和生命周期钩子的基础。
 * 
 * @packageDocumentation
 */

/**
 * 响应式状态标记 Symbol
 * 用于在运行时识别一个对象是否为响应式状态
 */
export const ReactiveMarker = Symbol('reactive');

/**
 * 计算属性标记 Symbol
 * 用于在运行时识别一个对象是否为计算属性
 */
export const ComputedMarker = Symbol('computed');

/**
 * 响应式状态接口
 * 
 * 表示一个可变的响应式数据，当 value 被修改时会自动通知所有依赖者。
 * 类似于 Vue 3 的 Ref<T> 或 React 的 State。
 * 
 * @template T - 状态值的类型
 * 
 * @example
 * ```tsx
 * const count = useState(0);
 * console.log(count.value); // 读取: 0
 * count.value = 5;          // 写入: 触发更新
 * ```
 */
export interface ReactiveState<T> {
  /**
   * 响应式标记，用于类型守卫
   * @internal
   */
  readonly [ReactiveMarker]: true;
  
  /**
   * 获取当前状态值
   */
  get value(): T;
  
  /**
   * 设置新的状态值，触发响应式更新
   */
  set value(newValue: T);
}

/**
 * 计算属性接口
 * 
 * 表示一个只读的派生响应式数据，其值由 getter 函数计算得出。
 * 自动追踪 getter 中访问的所有响应式依赖，当依赖变化时重新计算。
 * 
 * @template T - 计算结果的类型
 * 
 * @example
 * ```tsx
 * const count = useState(0);
 * const doubled = useComputed(() => count.value * 2);
 * console.log(doubled.value); // 自动计算: 0
 * count.value = 5;
 * console.log(doubled.value); // 自动重新计算: 10
 * ```
 */
export interface ComputedState<T> {
  /**
   * 计算属性标记，用于类型守卫
   * @internal
   */
  readonly [ComputedMarker]: true;
  
  /**
   * 获取计算结果（只读）
   */
  readonly value: T;
}

/**
 * Watch 选项
 * 
 * 配置 useWatch 的行为。
 */
export interface WatchOptions {
  /**
   * 是否立即执行一次回调（在组件挂载时）
   * @default false
   */
  immediate?: boolean;
  
  /**
   * 是否深度监听对象内部属性的变化
   * @default false
   */
  deep?: boolean;
}

/**
 * 副作用清理函数
 * 
 * 用于清理副作用（如定时器、事件监听器、HTTP 请求）。
 * 在组件卸载或副作用重新执行前自动调用。
 */
export type CleanupFunction = () => void;

/**
 * 副作用回调函数
 * 
 * @param onCleanup - 注册清理函数的方法
 * @returns 可选的清理函数，或 Promise（支持异步副作用）
 */
export type EffectCallback = (
  onCleanup: (cleanup: CleanupFunction) => void
) => void | CleanupFunction | Promise<void>;

/**
 * 依赖数组类型
 * 
 * 只读的任意类型数组，用于声明副作用的依赖。
 * 当依赖数组中的任一项变化时，副作用会重新执行。
 */
export type DependencyList = readonly any[];

/**
 * 组件 Props 定义
 * 
 * 用于声明组件接收的属性类型。
 * 
 * @template P - Props 对象类型
 */
export type PropDefinition<P = {}> = {
  [K in keyof P]: {
    type: any;
    required?: boolean;
    default?: P[K] | (() => P[K]);
  };
};

/**
 * 组件事件定义
 * 
 * 用于声明组件可以触发的事件列表。
 */
export type EmitDefinition = string[];

/**
 * 渲染函数
 * 
 * 返回 JSX 元素的函数，当响应式依赖变化时自动重新执行。
 */
export type RenderFunction = () => any; // JSX.Element in runtime

/**
 * 组件 setup 上下文
 * 
 * 提供给 setup 函数的上下文对象（预留，未来可能需要）。
 */
export interface SetupContext {
  // 未来可能添加: emit, slots, attrs 等
}

/**
 * 组件选项
 * 
 * 用于配置组件的 props 和 events。
 * 
 * @template P - Props 类型
 */
export interface ComponentOptions<P = {}> {
  /**
   * Props 定义
   */
  props?: PropDefinition<P>;
  
  /**
   * 事件定义
   */
  emits?: EmitDefinition;
}

/**
 * 组件类型
 * 
 * 表示一个已定义的组件。
 * 
 * @template P - Props 类型
 */
export interface Component<P = {}> {
  /**
   * 组件标记（内部使用）
   * @internal
   */
  readonly __component: true;
  
  /**
   * Props 类型（类型推导使用）
   * @internal
   */
  readonly __props: P;
}

/**
 * 页面元数据
 * 
 * 用于配置页面的路由、标题、权限等信息。
 */
export interface PageMeta {
  /**
   * 路由路径（如 '/orders', '/users/:id'）
   */
  route: string;
  
  /**
   * 页面标题
   */
  title: string;
  
  /**
   * 权限标识（如 'order:list', 'user:edit'）
   * 编译时会生成路由守卫代码
   */
  permission?: string;
  
  /**
   * 菜单配置
   */
  menu?: {
    /**
     * 父菜单 ID
     */
    parent?: string;
    
    /**
     * 菜单排序
     */
    order?: number;
    
    /**
     * 菜单图标
     */
    icon?: string;
  };
}

/**
 * 路由器接口
 * 
 * 提供路由导航方法。
 */
export interface Router {
  /**
   * 导航到指定路径（添加历史记录）
   */
  push(path: string): Promise<void>;
  
  /**
   * 替换当前路径（不添加历史记录）
   */
  replace(path: string): Promise<void>;
  
  /**
   * 后退
   */
  back(): void;
  
  /**
   * 前进/后退 n 步
   */
  go(n: number): void;
}

/**
 * 当前路由信息
 * 
 * 包含当前路由的路径、参数、查询字符串等信息。
 */
export interface Route {
  /**
   * 当前路径（如 '/orders/123'）
   */
  path: string;
  
  /**
   * 路由参数（如 { id: '123' }）
   */
  params: Record<string, string>;
  
  /**
   * 查询参数（如 { page: '1', status: 'pending' }）
   */
  query: Record<string, string | string[]>;
  
  /**
   * 路由元信息
   */
  meta: Record<string, any>;
}

/**
 * 查询选项
 * 
 * 配置 useQuery 的缓存、重试等行为。
 * 
 * @template TData - 查询结果数据类型
 * @template TError - 错误类型
 */
export interface QueryOptions<TData, TError = Error> {
  /**
   * 是否启用查询（默认 true）
   */
  enabled?: boolean;
  
  /**
   * 缓存时间（毫秒），数据在缓存中保留的时间
   * @default 5 * 60 * 1000 (5 分钟)
   */
  cacheTime?: number;
  
  /**
   * 数据新鲜时间（毫秒），在此时间内认为数据是新鲜的，不重新请求
   * @default 0 (始终重新请求)
   */
  staleTime?: number;
  
  /**
   * 重试次数或重试策略
   * @default 3
   */
  retry?: number | boolean;
  
  /**
   * 查询成功回调
   */
  onSuccess?: (data: TData) => void;
  
  /**
   * 查询失败回调
   */
  onError?: (error: TError) => void;
}

/**
 * 查询结果
 * 
 * 包含查询的数据、加载状态、错误信息和刷新方法。
 * 
 * @template TData - 查询结果数据类型
 * @template TError - 错误类型
 */
export interface QueryResult<TData, TError = Error> {
  /**
   * 查询结果数据（计算属性）
   */
  data: ComputedState<TData | undefined>;
  
  /**
   * 错误信息（计算属性）
   */
  error: ComputedState<TError | null>;
  
  /**
   * 加载状态（计算属性）
   */
  loading: ComputedState<boolean>;
  
  /**
   * 手动刷新查询
   */
  refetch: () => Promise<void>;
}

/**
 * 变更选项
 * 
 * 配置 useMutation 的回调行为。
 * 
 * @template TData - 变更结果数据类型
 * @template TVariables - 变更参数类型
 * @template TError - 错误类型
 */
export interface MutationOptions<TData, TVariables, TError = Error> {
  /**
   * 变更成功回调
   */
  onSuccess?: (data: TData, variables: TVariables) => void;
  
  /**
   * 变更失败回调
   */
  onError?: (error: TError, variables: TVariables) => void;
  
  /**
   * 变更完成回调（无论成功或失败）
   */
  onSettled?: (data: TData | undefined, error: TError | null) => void;
}

/**
 * 变更结果
 * 
 * 包含变更方法、加载状态、错误信息和重置方法。
 * 
 * @template TData - 变更结果数据类型
 * @template TVariables - 变更参数类型
 * @template TError - 错误类型
 */
export interface MutationResult<TData, TVariables, TError = Error> {
  /**
   * 执行变更（同步返回 Promise）
   */
  mutate: (variables: TVariables) => Promise<TData>;
  
  /**
   * 执行变更（异步版本，等同于 mutate）
   */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  
  /**
   * 加载状态（计算属性）
   */
  loading: ComputedState<boolean>;
  
  /**
   * 错误信息（计算属性）
   */
  error: ComputedState<TError | null>;
  
  /**
   * 变更结果数据（计算属性）
   */
  data: ComputedState<TData | undefined>;
  
  /**
   * 重置状态
   */
  reset: () => void;
}

