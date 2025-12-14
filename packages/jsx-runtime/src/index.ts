/**
 * @ai-builder/jsx-runtime
 * 
 * 自定义 JSX 运行时 + DSL 定义层
 * 
 * 🎯 职责划分：
 * - jsx-runtime: JSX 编译、DSL 定义 API、元数据管理
 * - dsl-runtime: 运行时功能（路由、状态、数据库等）
 * 
 * @example
 * ```tsx
 * // DSL 定义（从 jsx-runtime）
 * import { definePage, defineEntity, Field } from '@ai-builder/jsx-runtime';
 * 
 * // 运行时功能（从 dsl-runtime）
 * import { initDatabase, createDSLRouter } from '@ai-builder/dsl-runtime';
 * ```
 */

// ==================== JSX 核心 ====================

// 导出类型
export * from './types';

// 导出 createElement (Classic 模式)
export { createElement, createElement as h, Fragment, createFragment } from './create-element';

// 导出 jsx/jsxs (Automatic 模式)
export { jsx, jsxs, jsxDEV } from './jsx-runtime';

// 工具函数
export { renderToString, vnodeToJson } from './render-to-string';
export { traverseVNode, flattenChildren, cloneVNode, getDisplayName } from './utils';

// ==================== React 渲染器 ====================

export { 
  vnodeToReact, 
  registerAntdComponents,
  DSLPageRenderer as LegacyDSLPageRenderer,
  createDSLApp,
} from './react-renderer';

export {
  DSLPageRenderer,
  DSLAppRenderer,
  RouterProvider,
  createDSLRouter,
  useState as useBridgedState,
  useEffect as useBridgedEffect,
  useComputed as useBridgedComputed,
  vnodeToReactElement,
  registerComponents,
} from './react-bridge';

// ==================== DSL 定义层 + 核心运行时 ====================

export {
  // 响应式原语
  useState,
  useComputed,
  useWatch,
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
  setEffectHookImplementation,
  getEffectHookImplementation,
  type EffectHookImplementation,
  // 页面上下文
  PageContext,
  getCurrentContext,
  setCurrentContext,
  runInContext,
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
  createRouter,
  setRouter,
  getRouter,
  flattenRoutes,
  getMenuRoutes,
  filterRoutesByPermission,
  clearPageCache,
  // DSL 引擎
  DSLEngine,
  getEngine,
  setEngine,
  definePage,
  defineComponent,
  // 页面注册表
  getPageByRoute,
  getDefaultPage,
  getAllPages,
  // 组件注册表
  getComponent,
  getAllComponents,
  getComponentsByCategory,
  // 应用级 DSL
  defineApp,
  getAppDefinition,
  getMergedAppConfig,
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

// ==================== Metadata Store ====================

export {
  metadataStore,
  registerMetadata,
  registerExtension,
  defineExtension,
  type ExtensionDefinition,
  type DefineExtensionConfig,
  type MethodExtensionConfig,
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

// ==================== ORM DSL ====================

export {
  QueryBuilder,
  CreateBuilder,
  UpdateBuilder,
  DeleteBuilder,
  SaveBuilder,
  query,
  create,
  update,
  remove,
  save,
  saveAll,
  findById,
  findByIdOrThrow,
  transaction,
  setORMAdapter,
  getActiveORMAdapter,
  getInMemoryAdapter,
  InMemoryORMAdapter,
} from './dsl-runtime/orm-dsl';

export type {
  EntityClass,
  FieldPath,
  FieldValue,
  NestedPath,
  NestedValue,
  ArrayField,
  ArrayElement,
  ArrayElementField,
  ArrayElementValue,
  SortDirection,
  CompareOperator,
  WhereCondition,
  WhereGroup,
  OrderByClause,
  PaginationInfo,
  QueryResult,
  SingleResult,
  QuerySpec,
  IORMAdapter,
} from './dsl-runtime/orm-dsl';

// ==================== 适配器层 ====================

export {
  adapterRegistry,
  registerAdapter,
  activateAdapter,
  registerComponentMapping,
  getAdaptedComponent,
  getAllComponentMappings,
  ADAPTER_NAMES,
} from './adapter';

export type {
  ComponentAdapter,
  ComponentMapping,
  AdapterConfig,
  AdapterName,
} from './adapter';

// ==================== 类型导出 ====================

export type {
  DSLType as MetadataDSLType,
  DSLLayer,
  DSLSubLayer,
  BaseDSLMetadata,
  LayeredMetadata,
} from './dsl-runtime/metadata-store';

export type {
  // 状态类型
  StateRef,
  // 页面上下文类型
  IPageContext,
  // 路由类型
  NavigateOptions,
  LocationInfo,
  RouteMatch,
  RouterAdapter,
  RouteGuard,
  RouteOverride,
  RouteConfig,
  Router,
  // DSL 引擎类型
  PageMeta,
  LifecycleType,
  PageDefinition,
  DSLEngineConfig,
  ComponentMeta,
  ComponentDefinition,
  AppServiceMeta,
  AppServiceDefinition,
  ServiceMeta,
  ServiceDefinition,
  RepositoryMeta,
  RepositoryDefinition,
  MethodsDefinition,
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
  DTOFieldType,
  DTOFieldDefinition,
  DTOFieldsDefinition,
  DTODefinition,
  ConstantType,
  ConstantDefinition,
  InferFieldType,
  InferDTOFields,
  InferDTOType,
  InferDTO,
  ValidationRuleDefinition,
  ComputationRuleDefinition,
  ActionRuleDefinition,
  RuleDefinition,
  RuleInput,
  DomainLogicDefinition,
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
} from './dsl-runtime';
