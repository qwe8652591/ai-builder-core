/**
 * @qwe8652591/dsl-core
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
 * import { definePage, defineEntity, Field } from '@qwe8652591/dsl-core';
 * 
 * // 运行时功能（从 dsl-runtime）
 * import { initDatabase, createDSLRouter } from '@qwe8652591/dsl-runtime';
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

// ==================== DSL 定义层 + 核心运行时 ====================
// 注：React 渲染器已迁移到 @qwe8652591/dsl-runtime

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
  defineEmbeddable,
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
  defineLogic,
  executeValidation,
  executeComputation,
  executeAction,
  validateAll,
  // 装饰器
  Entity,
  Embeddable,
  DTO,
  Enum,
  Column,
  Field,
  EnumValue,
  PrimaryKey,
  Index,
  type IndexOptions,
  Relation,
  OneToMany,
  OneToOne,
  Embedded,
  getEntityDefinition,
  getEmbeddableDefinition,
  getDTODefinition,
  // 枚举增强
  registerEnum,
  defineTypedEnum,
  // 领域逻辑装饰器
  Logic,
  Validation,
  Computation,
  Check,
  Action,
  RuleTypes,
  getLogicDefinition,
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
  DSLMetadataStore,
  registerMetadata,
  updateMetadata,
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
  // 🆕 类型映射工具函数
  getTypeLayer,
  getTypeSubLayer,
  getTypeLabel,
  getTypeIcon,
  // AST 元数据初始化
  initMetadataFromAST,
  clearAllMetadata,
  type ASTMetadataItem,
  // 🆕 自定义类型注册 API
  registerDSLType,
  getDSLTypeConfig,
  getAllDSLTypes,
  onMetadataChange,
  triggerDeriveMetadata,
  type CustomTypeConfig,
  type DefineMethod,
  type DerivedMetadataItem,
  type MetadataChangeListener,
  // 🆕 工厂函数 API
  type BaseDefinition,
  createDefiner,
  createDecorator,
  createPropertyDecorator,
  // 🆕 派生元数据工具
  type EntityRelation,
  computeEntityRelations,
  enableEntityRelationDerive,
  getEntityRelations,
} from './dsl-runtime/metadata-store';

// VNode 解析工具
export { extractComponentsFromVNode } from './dsl-runtime/dsl-engine';

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

// ==================== 项目配置类型 ====================

export type { DSLProjectConfig } from './dsl-runtime/project-config';

// ==================== 类型导出 ====================

export type {
  DSLType as MetadataDSLType,
  BuiltinDSLType,
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
  EmbeddableDefinition,
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
  LogicDefinition,
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
