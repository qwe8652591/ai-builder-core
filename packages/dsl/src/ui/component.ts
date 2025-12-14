/**
 * 组件定义模块
 * 
 * 提供 `definePage` 和 `defineComponent` 函数，用于定义页面和可复用组件。
 * 这些是编译期 DSL，会被编译器转换为目标框架的组件定义。
 * 
 * @module component
 */

import type { PageMeta, ComponentOptions, Component, RenderFunction } from './types';

/**
 * 定义页面组件
 * 
 * 用于定义一个页面级组件，包含路由、权限等元数据。
 * 编译器会根据元数据生成路由配置和权限守卫代码。
 * 
 * @template P - Props 类型
 * @param meta - 页面元数据（路由、标题、权限等）
 * @param setup - Setup 函数，返回渲染函数
 * @returns 页面组件
 * 
 * @example
 * ```tsx
 * // 基础用法
 * export default definePage(
 *   {
 *     route: '/orders',
 *     title: '订单列表',
 *     permission: 'order:list'
 *   },
 *   () => {
 *     const orders = useState<Order[]>([]);
 *     
 *     return () => (
 *       <div>
 *         <h1>订单列表</h1>
 *         {orders.value.map(order => (
 *           <div key={order.id}>{order.name}</div>
 *         ))}
 *       </div>
 *     );
 *   }
 * );
 * 
 * // 带菜单配置
 * export default definePage(
 *   {
 *     route: '/users/:id',
 *     title: '用户详情',
 *     permission: 'user:view',
 *     menu: {
 *       parent: 'system',
 *       order: 1,
 *       icon: 'user'
 *     }
 *   },
 *   () => {
 *     const userId = useParams('id');
 *     const user = useState<User | null>(null);
 *     
 *     return () => (
 *       <div>
 *         <h1>用户: {user.value?.name}</h1>
 *       </div>
 *     );
 *   }
 * );
 * ```
 * 
 * @remarks
 * 这是编译期 DSL，函数体在运行时不会执行。
 * 
 * **编译器行为**:
 * - 提取 `meta.route` 生成路由配置
 * - 根据 `meta.permission` 生成权限守卫
 * - 根据 `meta.menu` 生成菜单项配置
 * - 将 setup 函数编译为目标框架的组件定义
 * 
 * **Vue 3 编译产物**:
 * ```typescript
 * import { defineComponent } from 'vue';
 * 
 * export default defineComponent({
 *   name: 'OrderList',
 *   setup() {
 *     const orders = ref([]);
 *     return () => h('div', ...);
 *   }
 * });
 * 
 * // 路由配置（单独生成）
 * {
 *   path: '/orders',
 *   component: OrderList,
 *   meta: {
 *     title: '订单列表',
 *     permission: 'order:list'
 *   }
 * }
 * ```
 * 
 * **React 编译产物**:
 * ```typescript
 * function OrderList() {
 *   const [orders, setOrders] = useState([]);
 *   return <div>...</div>;
 * }
 * 
 * // 路由配置（单独生成）
 * {
 *   path: '/orders',
 *   element: <OrderList />,
 *   meta: { ... }
 * }
 * ```
 * 
 * **与 defineComponent 的区别**:
 * - `definePage`: 页面级组件，包含路由和权限元数据
 * - `defineComponent`: 可复用的子组件，无路由元数据
 */
export function definePage<P = {}>(
  _meta: PageMeta,
  _setup: (props: P) => RenderFunction
): Component<P> {
  throw new Error(
    'definePage() is a compile-time DSL primitive. ' +
    'It should not be called at runtime. ' +
    'Please ensure your code is compiled by the AI Builder compiler before execution.'
  );
}

/**
 * 定义可复用组件
 * 
 * 用于定义一个可复用的子组件，支持 Props 类型推导和事件声明。
 * 适用于业务组件（如 OrderCard, UserAvatar）和通用组件。
 * 
 * @template P - Props 类型
 * @param options - 组件选项（props、emits 定义）
 * @param setup - Setup 函数，接收 props 并返回渲染函数
 * @returns 组件定义
 * 
 * @example
 * ```tsx
 * // 基础用法（无 Props）
 * export const HelloWorld = defineComponent(
 *   {},
 *   () => {
 *     return () => <div>Hello World</div>;
 *   }
 * );
 * 
 * // 带 Props 的组件
 * interface OrderStatusProps {
 *   status: 'pending' | 'completed' | 'cancelled';
 *   orderId: string;
 * }
 * 
 * export const OrderStatus = defineComponent<OrderStatusProps>(
 *   {
 *     props: {
 *       status: { type: String, required: true },
 *       orderId: { type: String, required: true }
 *     },
 *     emits: ['change']
 *   },
 *   (props) => {
 *     const statusText = useComputed(() => {
 *       return {
 *         pending: '待处理',
 *         completed: '已完成',
 *         cancelled: '已取消'
 *       }[props.status];
 *     });
 *     
 *     return () => (
 *       <span class={`status-${props.status}`}>
 *         {statusText.value}
 *       </span>
 *     );
 *   }
 * );
 * 
 * // 使用组件
 * <OrderStatus status="completed" orderId="123" />
 * 
 * // 带默认值的 Props
 * interface ButtonProps {
 *   type?: 'primary' | 'default';
 *   disabled?: boolean;
 *   text: string;
 * }
 * 
 * export const Button = defineComponent<ButtonProps>(
 *   {
 *     props: {
 *       type: { type: String, default: 'default' },
 *       disabled: { type: Boolean, default: false },
 *       text: { type: String, required: true }
 *     },
 *     emits: ['click']
 *   },
 *   (props) => {
 *     const handleClick = () => {
 *       if (!props.disabled) {
 *         // emit('click')
 *       }
 *     };
 *     
 *     return () => (
 *       <button
 *         class={`btn btn-${props.type}`}
 *         disabled={props.disabled}
 *         onClick={handleClick}
 *       >
 *         {props.text}
 *       </button>
 *     );
 *   }
 * );
 * ```
 * 
 * @remarks
 * 这是编译期 DSL，函数体在运行时不会执行。
 * 
 * **Props 类型推导**:
 * - TypeScript 泛型 `<P>` 定义 Props 接口
 * - `options.props` 用于运行时验证和默认值
 * - 编译器会合并类型和运行时定义
 * 
 * **Vue 3 编译产物**:
 * ```typescript
 * import { defineComponent } from 'vue';
 * 
 * export const OrderStatus = defineComponent({
 *   props: {
 *     status: { type: String, required: true },
 *     orderId: { type: String, required: true }
 *   },
 *   emits: ['change'],
 *   setup(props) {
 *     const statusText = computed(() => ...);
 *     return () => h('span', ...);
 *   }
 * });
 * ```
 * 
 * **React 编译产物**:
 * ```typescript
 * interface OrderStatusProps {
 *   status: 'pending' | 'completed' | 'cancelled';
 *   orderId: string;
 *   onChange?: () => void;
 * }
 * 
 * export function OrderStatus(props: OrderStatusProps) {
 *   const statusText = useMemo(() => ..., [props.status]);
 *   return <span className={`status-${props.status}`}>...</span>;
 * }
 * ```
 * 
 * **最佳实践**:
 * 1. 始终提供 TypeScript 接口定义 Props 类型
 * 2. 在 `options.props` 中声明必填项和默认值
 * 3. 使用 `emits` 明确声明组件可以触发的事件
 * 4. Props 尽量保持简单，避免嵌套过深的对象
 */
export function defineComponent<P = {}>(
  _options: ComponentOptions<P>,
  _setup: (props: P) => RenderFunction
): Component<P> {
  throw new Error(
    'defineComponent() is a compile-time DSL primitive. ' +
    'It should not be called at runtime. ' +
    'Please ensure your code is compiled by the AI Builder compiler before execution.'
  );
}





