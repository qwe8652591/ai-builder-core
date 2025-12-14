/**
 * @ai-builder/jsx-runtime
 * 
 * 自定义 JSX 运行时，将 JSX 编译为框架无关的 VNode
 * 
 * @example
 * ```tsx
 * // tsconfig.json 或 vite.config.ts 配置
 * {
 *   "compilerOptions": {
 *     "jsx": "react-jsx",
 *     "jsxImportSource": "@ai-builder/jsx-runtime"
 *   }
 * }
 * 
 * // 编写 DSL
 * import { definePage, useState } from '@ai-builder/dsl/ui';
 * import { Page, Table } from '@ai-builder/std-ui';
 * 
 * export default definePage({
 *   meta: { title: '订单列表' },
 *   setup() {
 *     const [data, setData] = useState([]);
 *     return (
 *       <Page title="订单">
 *         <Table data={data} />
 *       </Page>
 *     );
 *   }
 * });
 * ```
 */

// 导出类型
export * from './types';

// 导出 createElement (Classic 模式)
export { createElement, Fragment, createFragment } from './create-element';

// 导出 jsx/jsxs (Automatic 模式)
export { jsx, jsxs, jsxDEV } from './jsx-runtime';

// 工具函数
export { renderToString, vnodeToJson } from './render-to-string';
export { traverseVNode, flattenChildren, cloneVNode, getDisplayName } from './utils';

// React 渲染器（用于将 VNode 转换为 React 元素）
export { 
  vnodeToReact, 
  registerAntdComponents,
  DSLPageRenderer as LegacyDSLPageRenderer,
  createDSLApp,
} from './react-renderer';

// React 桥接器（运行时桥接 DSL 到 React）
export {
  // 组件
  DSLPageRenderer,
  DSLAppRenderer,
  // 🎯 路由组件（推荐）
  RouterProvider,
  createDSLRouter,
  // Hook 桥接
  useState as useBridgedState,
  useEffect as useBridgedEffect,
  useComputed as useBridgedComputed,
  // VNode 转换
  vnodeToReactElement,
  registerComponents,
} from './react-bridge';

// DSL 运行时
export {
  // 响应式原语
  useState,
  useComputed,
  useWatch,
  // Hook 代理（用于外部渲染器注入）
  setHookImplementation,
  getHookImplementation,
  type HookImplementation,
  type StateSetter,
  // 生命周期
  useEffect,
  onMounted,
  onUnmounted,
  onBeforeMount,
  onBeforeUnmount,
  // Effect Hook 代理
  setEffectHookImplementation,
  getEffectHookImplementation,
  type EffectHookImplementation,
  // 页面上下文
  PageContext,
  getCurrentContext,
  setCurrentContext,
  runInContext,
  // DSL 引擎
  DSLEngine,
  getEngine,
  setEngine,
  definePage,
  defineComponent,
  // 页面注册表（路由匹配）
  getPageByRoute,
  getDefaultPage,
  getAllPages,
  // 组件注册表
  getComponent,
  getAllComponents,
  getComponentsByCategory,
  // 服务层 DSL
  defineAppService,
  defineService,
  defineRepository,
  setDSLDbGetter,
  setDSLEventBusGetter,
  registerDSLService,
  createServiceInstance,
  getDSLService,
  clearDSLServiceInstances,
  // 模型层 DSL
  defineEntity,
  defineValueObject,
  defineEnum,
  getFieldTypeString,
  getFieldNames,
  getPrimaryKeyField,
  getRequiredFields,
  // 类型安全常量
  FieldTypes,
  RelationTypes,
  CascadeTypes,
  // DTO 层 DSL
  defineDTO,
  defineConstant,
  getDTOFields,
  getConstantValue,
  // DTO 类型安全常量
  DTOFieldTypes,
  ConstantTypes,
  // 应用层通用类型
  type Result,
  type PageResult,
  type PageQuery,
  success,
  failure,
  pageResult,
  // 领域逻辑 DSL
  defineRule,
  defineDomainLogic,
  executeValidation,
  executeComputation,
  executeAction,
  validateAll,
  // 装饰器
  Entity,
  ValueObject,
  DTO,
  Enum,
  Column,
  Field,
  EnumValue,
  PrimaryKey,
  Relation,
  OneToMany,
  OneToOne,
  getEntityDefinition,
  getValueObjectDefinition,
  getDTODefinition,
  // 枚举增强
  registerEnum,
  defineTypedEnum,
  // 领域逻辑装饰器
  DomainLogic,
  Validation,
  Computation,
  Check,
  Action,
  RuleTypes,
  getDomainLogicDefinition,
  // 服务层装饰器
  Repository,
  Service,
  AppService,
  Method,
  getRepositoryDefinition,
  getServiceDefinition,
  getAppServiceDefinition,
  // 路由 DSL
  useNavigate,
  useParams,
  useQuery,
  useLocation,
  setRouterAdapter,
  getRouterAdapter,
  defineRouteOverrides,
  getRouteOverride,
  clearRouteOverrides,
  buildUrl,
  parseUrl,
  HashRouterAdapter,
  // 🎯 路由配置 API（参考 React Router v6）
  createRouter,
  setRouter,
  getRouter,
  flattenRoutes,
  getMenuRoutes,
  filterRoutesByPermission,
  clearPageCache,
} from './dsl-runtime';

// DSL 转 JSON 工具
export {
  detectDSLType,
  dslToJson,
  dslCollectionToJson,
  groupDSLByLayer,
  fieldsToTable,
  dslToHtmlCard,
  renderDSLCollection,
} from './dsl-runtime/dsl-to-json';

export type {
  DSLType,
  FieldMetadata,
  DSLMetadata,
  DSLByLayer,
} from './dsl-runtime/dsl-to-json';

// Metadata Store
export {
  metadataStore,
  registerMetadata,
  getMetadata,
  getDefinition,
  getMetadataByType,
  getAllMetadata,
  getLayeredMetadata,
  getMetadataStats,
  getLayeredStats,
  typeToLayer,
  typeToSubLayer,
  typeLabels,
  typeIcons,
} from './dsl-runtime/metadata-store';

// 🎯 适配器层（用于切换 UI 框架）
export {
  // 适配器注册表
  adapterRegistry,
  // 便捷函数
  registerAdapter,
  activateAdapter,
  registerComponentMapping,
  getAdaptedComponent,
  getAllComponentMappings,
  // 预定义适配器名称
  ADAPTER_NAMES,
} from './adapter';

export type {
  ComponentAdapter,
  ComponentMapping,
  AdapterConfig,
  AdapterName,
} from './adapter';

export type {
  DSLType as MetadataDSLType,
  DSLLayer,
  DSLSubLayer,
  BaseDSLMetadata,
  LayeredMetadata,
} from './dsl-runtime/metadata-store';

export type {
  StateRef,
  // StateSetter 已在上面导出
  IPageContext,
  PageMeta,
  LifecycleType,
  PageDefinition,
  DSLEngineConfig,
  // 组件类型
  ComponentMeta,
  ComponentDefinition,
  // 服务层 DSL 类型
  AppServiceMeta,
  AppServiceDefinition,
  ServiceMeta,
  ServiceDefinition,
  RepositoryMeta,
  RepositoryDefinition,
  MethodsDefinition,
  // 模型层 DSL 类型
  FieldType,
  RelationType,
  CascadeType,
  ValidationRule,
  FieldDefinition,
  FieldsDefinition,
  EnumValueDefinition,
  EnumDefinition,
  ValueObjectDefinition,
  EntityDefinition,
  // DTO 层 DSL 类型
  DTOFieldType,
  DTOFieldDefinition,
  DTOFieldsDefinition,
  DTODefinition,
  ConstantType,
  ConstantDefinition,
  // DTO 类型推断工具
  InferFieldType,
  InferDTOFields,
  InferDTOType,
  InferDTO,  // 简写别名
  // 领域逻辑 DSL 类型
  ValidationRuleDefinition,
  ComputationRuleDefinition,
  ActionRuleDefinition,
  RuleDefinition,
  RuleInput,
  DomainLogicDefinition,
  // 装饰器类型
  ColumnOptions,
  RelationOptions,
  EntityOptions,
  DTOOptions,
  EnumOptions,
  EnumValueOptions,
  EnumLabelsConfig,
  EnhancedEnum,
  TypedEnumConfig,
  TypedEnum,
  // 路由 DSL 类型
  NavigateOptions,
  LocationInfo,
  RouteMatch,
  RouterAdapter,
  RouteGuard,
  RouteOverride,
  // 🎯 路由配置类型（参考 React Router v6）
  RouteConfig,
  Router,
} from './dsl-runtime';

