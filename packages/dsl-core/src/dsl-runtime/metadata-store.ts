/**
 * DSL Metadata Store
 * 
 * 统一管理所有 DSL 定义的元数据
 * - 定义时自动注册
 * - 支持按类型、名称查询
 * - 支持运行时访问所有元数据
 * - 🆕 支持自定义类型注册
 * - 🆕 支持派生元数据（从现有元数据分析生成）
 */

// ==================== 类型定义 ====================

/** 内置 DSL 类型 */
export type BuiltinDSLType = 
  | 'entity' 
  | 'valueObject' 
  | 'enum' 
  | 'dto' 
  | 'constant'
  | 'rule'
  | 'domainLogic'
  | 'repository'
  | 'service'
  | 'appService'
  | 'page'
  | 'component'
  | 'extension';

/** DSL 类型（内置 + 自定义） */
export type DSLType = BuiltinDSLType | string;

/** DSL 层级（DDD 分层） */
export type DSLLayer = 'domain' | 'application' | 'presentation' | 'infrastructure' | 'custom';

/** DSL 子层级 */
export type DSLSubLayer = 
  | 'model'      // 领域模型（Entity, Embeddable, Enum）
  | 'domain'     // 领域规则（Rule, Logic）
  | 'repository' // 数据访问
  | 'service'    // 内部服务
  | 'dto'        // 数据传输对象
  | 'appService' // 应用服务
  | 'view'       // 视图/页面
  | 'component'  // 自定义组件
  | 'extension'  // 扩展
  | 'derived'    // 🆕 派生元数据
  | 'custom';    // 🆕 自定义

// ==================== 自定义类型注册 ====================

/** 定义方式 */
export type DefineMethod = 'function' | 'decorator' | 'derived' | 'both';

/** 自定义类型配置 */
export interface CustomTypeConfig {
  /** 类型名称 */
  type: string;
  /** 所属层级 */
  layer: DSLLayer;
  /** 子层级 */
  subLayer?: DSLSubLayer;
  /** 显示标签 */
  label: string;
  /** 图标 */
  icon?: string;
  /** 定义方式 */
  defineMethod?: DefineMethod;
  /** 
   * 派生源类型（派生元数据用）
   * 当这些类型的元数据变化时，会触发派生计算
   */
  derivedFrom?: string[];
  /**
   * 派生计算函数
   * @param store - Metadata Store 实例
   * @returns 派生出的元数据数组
   */
  derive?: (store: DSLMetadataStore) => DerivedMetadataItem[];
  /** 描述 */
  description?: string;
}

/** 派生元数据项 */
export interface DerivedMetadataItem {
  name: string;
  __type: string;
  [key: string]: unknown;
}

/** 已注册的自定义类型 */
const customTypeRegistry = new Map<string, CustomTypeConfig>();

/** 动态类型映射表 */
const dynamicTypeToLayer: Record<string, DSLLayer> = {};
const dynamicTypeToSubLayer: Record<string, DSLSubLayer> = {};
const dynamicTypeLabels: Record<string, string> = {};
const dynamicTypeIcons: Record<string, string> = {};

/** 元数据基础接口 */
export interface BaseDSLMetadata {
  /** 唯一标识（通常是名称） */
  name: string;
  /** DSL 类型 */
  __type: DSLType;
  /** 描述/注释 */
  comment?: string;
  description?: string;
  /** 原始定义对象 */
  definition: unknown;
  /** 注册时间 */
  registeredAt: number;
}

/** 分层视图 */
export interface LayeredMetadata {
  domain: {
    model: Map<string, BaseDSLMetadata>;
    domain: Map<string, BaseDSLMetadata>;
    repository: Map<string, BaseDSLMetadata>;
    service: Map<string, BaseDSLMetadata>;
  };
  application: {
    dto: Map<string, BaseDSLMetadata>;
    appService: Map<string, BaseDSLMetadata>;
  };
  presentation: {
    view: Map<string, BaseDSLMetadata>;
    component: Map<string, BaseDSLMetadata>;
  };
  // 🆕 基础设施层（扩展）
  infrastructure: {
    extension: Map<string, BaseDSLMetadata>;
  };
}

// ==================== Metadata Store 实现 ====================

/** 元数据变更监听器 */
export type MetadataChangeListener = (
  event: 'add' | 'update' | 'remove',
  type: string,
  name: string,
  metadata?: BaseDSLMetadata
) => void;

/**
 * DSL Metadata Store
 * 
 * 单例模式，统一管理所有 DSL 元数据
 * 支持动态类型注册和派生元数据
 */
export class DSLMetadataStore {
  /** 所有元数据（按名称索引） */
  private byName = new Map<string, BaseDSLMetadata>();
  
  /** 按类型索引 */
  private byType = new Map<string, Map<string, BaseDSLMetadata>>();
  
  /** 派生元数据缓存 */
  private derivedCache = new Map<string, Map<string, BaseDSLMetadata>>();
  
  /** 变更监听器 */
  private listeners: MetadataChangeListener[] = [];
  
  /** 是否正在进行派生计算（防止循环） */
  private isDerivingFlag = false;
  
  /** 内置类型列表 */
  private readonly builtinTypes: BuiltinDSLType[] = [
    'entity', 'valueObject', 'enum', 'dto', 'constant',
    'rule', 'domainLogic', 'repository', 'service', 'appService', 
    'page', 'component', 'extension'
  ];
  
  /** 初始化类型索引 */
  constructor() {
    // 初始化内置类型
    this.builtinTypes.forEach(type => this.byType.set(type, new Map()));
  }
  
  /**
   * 注册自定义 DSL 类型
   * 
   * @example
   * ```typescript
   * metadataStore.registerType({
   *   type: 'workflow',
   *   layer: 'application',
   *   label: '工作流',
   *   icon: '🔄',
   *   defineMethod: 'function',
   * });
   * ```
   */
  registerType(config: CustomTypeConfig): void {
    const { type, layer, subLayer, label, icon } = config;
    
    // 检查是否已存在
    if (this.builtinTypes.includes(type as BuiltinDSLType)) {
      console.warn(`[MetadataStore] 类型 "${type}" 是内置类型，无法覆盖`);
      return;
    }
    
    // 注册到自定义类型表
    customTypeRegistry.set(type, config);
    
    // 初始化类型索引
    if (!this.byType.has(type)) {
      this.byType.set(type, new Map());
    }
    
    // 更新动态映射表
    dynamicTypeToLayer[type] = layer;
    dynamicTypeToSubLayer[type] = subLayer || 'custom';
    dynamicTypeLabels[type] = label;
    if (icon) dynamicTypeIcons[type] = icon;
    
    console.log(`[MetadataStore] 已注册自定义类型: ${type} (${label})`);
    
    // 如果有派生配置，注册派生监听
    if (config.derivedFrom && config.derive) {
      this.setupDerivedType(config);
    }
  }
  
  /**
   * 设置派生类型监听
   */
  private setupDerivedType(config: CustomTypeConfig): void {
    const { type, derivedFrom, derive } = config;
    if (!derivedFrom || !derive) return;
    
    // 添加变更监听器
    this.addListener((event, changedType) => {
      // 如果变更的类型是派生源之一，重新计算
      if (derivedFrom.includes(changedType) && !this.isDerivingFlag) {
        this.computeDerived(type, derive);
      }
    });
    
    // 立即计算一次
    this.computeDerived(type, derive);
  }
  
  /**
   * 计算派生元数据
   */
  private computeDerived(type: string, derive: (store: DSLMetadataStore) => DerivedMetadataItem[]): void {
    this.isDerivingFlag = true;
    
    try {
      // 清空该类型的旧派生数据
      const typeMap = this.byType.get(type);
      if (typeMap) {
        for (const name of typeMap.keys()) {
          this.byName.delete(name);
        }
        typeMap.clear();
      }
      
      // 计算新的派生数据
      const derivedItems = derive(this);
      
      for (const item of derivedItems) {
        // 确保类型正确
        item.__type = type;
        this.register(item);
      }
      
      console.log(`[MetadataStore] 派生计算完成: ${type} (${derivedItems.length} 项)`);
    } finally {
      this.isDerivingFlag = false;
    }
  }
  
  /**
   * 添加变更监听器
   */
  addListener(listener: MetadataChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }
  
  /**
   * 触发变更通知
   */
  private notifyChange(
    event: 'add' | 'update' | 'remove',
    type: string,
    name: string,
    metadata?: BaseDSLMetadata
  ): void {
    for (const listener of this.listeners) {
      try {
        listener(event, type, name, metadata);
      } catch (e) {
        console.error('[MetadataStore] 监听器执行错误:', e);
      }
    }
  }
  
  /**
   * 检查类型是否已注册
   */
  hasType(type: string): boolean {
    return this.builtinTypes.includes(type as BuiltinDSLType) || customTypeRegistry.has(type);
  }
  
  /**
   * 获取所有已注册的类型
   */
  getAllTypes(): string[] {
    return [...this.builtinTypes, ...customTypeRegistry.keys()];
  }
  
  /**
   * 获取自定义类型配置
   */
  getTypeConfig(type: string): CustomTypeConfig | undefined {
    return customTypeRegistry.get(type);
  }
  
  /**
   * 注册 DSL 定义
   */
  register(definition: unknown): void {
    if (!definition || typeof definition !== 'object') return;
    
    const obj = definition as Record<string, unknown>;
    const type = obj.__type as string;
    if (!type) return;
    
    // 获取名称
    let name: string;
    if (obj.name) {
      name = obj.name as string;
    } else if (obj.meta && typeof obj.meta === 'object') {
      name = (obj.meta as Record<string, unknown>).name as string;
    } else {
      return; // 没有名称，无法注册
    }
    
    // 🆕 动态创建类型索引（支持未预注册的类型）
    if (!this.byType.has(type)) {
      this.byType.set(type, new Map());
      console.log(`[MetadataStore] 自动创建类型索引: ${type}`);
    }
    
    // 检查是否是更新
    const isUpdate = this.byName.has(name);
    
    // 创建元数据
    const metadata: BaseDSLMetadata = {
      name,
      __type: type as DSLType,
      comment: (obj.comment || obj.description || 
        (obj.meta && typeof obj.meta === 'object' ? (obj.meta as Record<string, unknown>).description : undefined)) as string | undefined,
      definition,
      registeredAt: Date.now(),
    };
    
    // 注册到索引
    this.byName.set(name, metadata);
    this.byType.get(type)?.set(name, metadata);
    
    console.log(`[MetadataStore] 已${isUpdate ? '更新' : '注册'}: ${type} - ${name}`);
    
    // 🆕 触发变更通知
    this.notifyChange(isUpdate ? 'update' : 'add', type, name, metadata);
  }
  
  /**
   * 更新已注册的元数据（部分更新）
   */
  update(name: string, updates: Partial<Record<string, unknown>>): void {
    const existing = this.byName.get(name);
    if (!existing) {
      console.warn(`[MetadataStore] 更新失败，未找到: ${name}`);
      return;
    }
    
    // 🔧 更新顶层 definition 对象（元数据注册时的完整结构）
    if (existing.definition && typeof existing.definition === 'object') {
      const def = existing.definition as Record<string, unknown>;
      // 将更新应用到 definition 的顶层
      Object.assign(def, updates);
    }
    
    console.log(`[MetadataStore] 已更新: ${name}`, Object.keys(updates));
  }
  
  /**
   * 根据名称获取元数据
   */
  get(name: string): BaseDSLMetadata | undefined {
    return this.byName.get(name);
  }
  
  /**
   * 根据名称获取原始定义
   */
  getDefinition<T = unknown>(name: string): T | undefined {
    return this.byName.get(name)?.definition as T | undefined;
  }
  
  /**
   * 根据类型获取所有元数据
   */
  getByType(type: string): Map<string, BaseDSLMetadata> {
    return this.byType.get(type) || new Map();
  }
  
  /**
   * 删除元数据
   */
  remove(name: string): boolean {
    const metadata = this.byName.get(name);
    if (!metadata) return false;
    
    const type = metadata.__type;
    this.byName.delete(name);
    this.byType.get(type)?.delete(name);
    
    // 触发变更通知
    this.notifyChange('remove', type, name);
    
    console.log(`[MetadataStore] 已删除: ${type} - ${name}`);
    return true;
  }
  
  /**
   * 手动触发派生计算（用于初始化或强制刷新）
   */
  triggerDerive(type?: string): void {
    if (type) {
      const config = customTypeRegistry.get(type);
      if (config?.derive) {
        this.computeDerived(type, config.derive);
      }
    } else {
      // 触发所有派生类型
      for (const [t, config] of customTypeRegistry) {
        if (config.derive) {
          this.computeDerived(t, config.derive);
        }
      }
    }
  }
  
  /**
   * 获取所有元数据
   */
  getAll(): Map<string, BaseDSLMetadata> {
    return new Map(this.byName);
  }
  
  /**
   * 获取所有名称
   */
  getAllNames(): string[] {
    return Array.from(this.byName.keys());
  }
  
  /**
   * 按 DDD 分层获取元数据
   */
  getLayered(): LayeredMetadata {
    return {
      domain: {
        model: new Map([
          ...this.getByType('entity'),
          ...this.getByType('valueObject'),
          ...this.getByType('enum'),
        ]),
        domain: new Map([
          ...this.getByType('rule'),
          ...this.getByType('domainLogic'),
        ]),
        repository: this.getByType('repository'),
        service: this.getByType('service'),
      },
      application: {
        dto: new Map([
          ...this.getByType('dto'),
          ...this.getByType('constant'),
        ]),
        appService: this.getByType('appService'),
      },
      presentation: {
        view: this.getByType('page'),
        component: this.getByType('component'),
      },
      // 🆕 基础设施层
      infrastructure: {
        extension: this.getByType('extension'),
      },
    };
  }
  
  /**
   * 获取统计信息
   */
  getStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [type, map] of this.byType) {
      stats[type] = map.size;
    }
    return stats;
  }
  
  /**
   * 获取自定义类型统计
   */
  getCustomTypeStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const type of customTypeRegistry.keys()) {
      stats[type] = this.byType.get(type)?.size || 0;
    }
    return stats;
  }
  
  /**
   * 检查是否已注册
   */
  has(name: string): boolean {
    return this.byName.has(name);
  }
  
  /**
   * 清空所有元数据（用于测试）
   */
  clear(): void {
    this.byName.clear();
    for (const map of this.byType.values()) {
      map.clear();
    }
  }
  
  /**
   * 导出为 JSON
   */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [name, metadata] of this.byName) {
      result[name] = {
        name: metadata.name,
        __type: metadata.__type,
        comment: metadata.comment,
      };
    }
    return result;
  }
  
  /**
   * 获取分层统计
   */
  getLayeredStats(): {
    domain: { model: number; domain: number; repository: number; service: number };
    application: { dto: number; appService: number };
    presentation: { view: number; component: number };
    infrastructure: { extension: number };  // 🆕
    total: number;
  } {
    const layered = this.getLayered();
    return {
      domain: {
        model: layered.domain.model.size,
        domain: layered.domain.domain.size,
        repository: layered.domain.repository.size,
        service: layered.domain.service.size,
      },
      application: {
        dto: layered.application.dto.size,
        appService: layered.application.appService.size,
      },
      presentation: {
        view: layered.presentation.view.size,
        component: layered.presentation.component.size,
      },
      // 🆕 基础设施层
      infrastructure: {
        extension: layered.infrastructure.extension.size,
      },
      total: this.byName.size,
    };
  }
}

// ==================== 单例导出 ====================

/** 全局 Metadata Store 实例 */
export const metadataStore = new DSLMetadataStore();

// ==================== 便捷函数 ====================

/**
 * 注册 DSL 定义到 store
 * 通常在 define* 函数内部调用
 */
export function registerMetadata(definition: unknown): void {
  metadataStore.register(definition);
}

/**
 * 更新已注册的元数据
 */
export function updateMetadata(name: string, updates: Partial<Record<string, unknown>>): void {
  metadataStore.update(name, updates);
}

/**
 * 扩展定义接口
 */
export interface ExtensionDefinition {
  /** 扩展名称 */
  name: string;
  /** 扩展描述 */
  description?: string;
  /** 扩展目标（被扩展的类或接口名） */
  target: string;
  /** 扩展类型：method（方法扩展）或 property（属性扩展） */
  type: 'method' | 'property' | 'metadata';
  /** 扩展的方法/属性列表 */
  members: Array<{
    name: string;
    description?: string;
    returnType?: string;
  }>;
}

/**
 * 注册扩展定义到 store（仅注册元数据）
 * 
 * @example
 * ```typescript
 * registerExtension({
 *   name: 'PurchaseOrderExtension',
 *   description: '采购订单扩展方法',
 *   target: 'PurchaseOrder',
 *   type: 'method',
 *   members: [
 *     { name: 'getStatusLabel', description: '获取状态标签', returnType: 'string' },
 *     { name: 'isEditable', description: '检查是否可编辑', returnType: 'boolean' },
 *   ],
 * });
 * ```
 */
export function registerExtension(extension: ExtensionDefinition): void {
  metadataStore.register({
    name: extension.name,
    __type: 'extension' as const,
    comment: extension.description,
    description: extension.description,
    target: extension.target,
    extensionType: extension.type,
    members: extension.members,
  });
}

/**
 * 方法扩展配置
 */
export interface MethodExtensionConfig<T, R = any> {
  /** 方法描述 */
  description?: string;
  /** 返回类型描述 */
  returnType?: string;
  /** 方法实现 */
  implementation: (this: T, ...args: any[]) => R;
}

/**
 * 提取接口中的方法名（排除非函数属性）
 */
type ExtractMethodKeys<T> = {
  [K in keyof T]: T[K] extends ((...args: any[]) => any) | undefined ? K : never;
}[keyof T];

/**
 * 定义扩展配置（带类型安全）
 * 
 * @typeParam T - 目标类（构造函数）
 * @typeParam M - 扩展方法接口（用于类型检查，确保方法名正确）
 */
export interface DefineExtensionConfig<
  T extends abstract new (...args: any) => any,
  M = unknown
> {
  /** 扩展名称 */
  name: string;
  /** 扩展描述 */
  description?: string;
  /** 目标类 */
  target: T;
  /** 
   * 方法定义
   * 当提供 M 泛型时，键必须是 M 中定义的方法名
   */
  methods: unknown extends M 
    ? Record<string, MethodExtensionConfig<InstanceType<T>>>  // M 未指定时，允许任意键
    : { [K in ExtractMethodKeys<M>]?: MethodExtensionConfig<InstanceType<T>> };  // M 指定时，键必须匹配
}

/**
 * 定义扩展（同时挂载方法到 prototype 并注册到 metadata）
 * 
 * 🎯 统一 API：一次调用完成运行时扩展 + metadata 注册
 * 
 * @typeParam T - 目标类
 * @typeParam M - 扩展方法接口（用于类型检查）
 * 
 * @example
 * ```typescript
 * // 1. 先定义扩展接口（用于 declare module）
 * interface SupplierExtensionMethods {
 *   isActive?(): boolean;
 *   getContactInfo?(): string;
 * }
 * 
 * // 2. 使用 declare module 扩展类型（IDE 支持）
 * declare module './models/Supplier.model' {
 *   interface Supplier extends SupplierExtensionMethods {}
 * }
 * 
 * // 3. 使用 defineExtension 定义扩展（带类型安全检查）
 * // ✅ 传入 SupplierExtensionMethods 作为第二个泛型参数
 * // ✅ methods 的键会被检查，必须是接口中定义的方法名
 * defineExtension<typeof Supplier, SupplierExtensionMethods>({
 *   name: 'SupplierExtension',
 *   target: Supplier,
 *   methods: {
 *     isActive: {  // ✅ 正确
 *       implementation(this: Supplier) { return this.status === 'ACTIVE'; },
 *     },
 *     isActve: {   // ❌ 类型错误：拼写错误会被检测到
 *       implementation(this: Supplier) { return true; },
 *     },
 *   },
 * });
 * ```
 */
export function defineExtension<
  T extends abstract new (...args: any) => any,
  M = unknown
>(
  config: DefineExtensionConfig<T, M>
): void {
  const { name, description, target, methods } = config;
  
  // 1. 挂载方法到 prototype
  const members: ExtensionDefinition['members'] = [];
  
  for (const [methodName, methodConfig] of Object.entries(methods)) {
    // 挂载到 prototype
    (target.prototype as any)[methodName] = methodConfig.implementation;
    
    // 收集 member 信息
    members.push({
      name: methodName,
      description: methodConfig.description,
      returnType: methodConfig.returnType,
    });
  }
  
  // 2. 注册到 metadata store
  registerExtension({
    name,
    description,
    target: target.name,
    type: 'method',
    members,
  });
  
  console.log(`[Extension] ${name} 已定义并注册（${members.length} 个方法）`);
}

/**
 * 获取元数据
 */
export function getMetadata(name: string): BaseDSLMetadata | undefined {
  return metadataStore.get(name);
}

/**
 * 获取原始定义
 */
export function getDefinition<T = unknown>(name: string): T | undefined {
  return metadataStore.getDefinition<T>(name);
}

/**
 * 按类型获取所有元数据
 */
export function getMetadataByType(type: DSLType): Map<string, BaseDSLMetadata> {
  return metadataStore.getByType(type);
}

/**
 * 获取所有元数据
 */
export function getAllMetadata(): Map<string, BaseDSLMetadata> {
  return metadataStore.getAll();
}

/**
 * 获取分层元数据
 */
export function getLayeredMetadata(): LayeredMetadata {
  return metadataStore.getLayered();
}

/**
 * 获取统计信息
 */
export function getMetadataStats(): Record<DSLType, number> {
  return metadataStore.getStats();
}

/**
 * 获取分层统计
 */
export function getLayeredStats() {
  return metadataStore.getLayeredStats();
}

// ==================== 类型映射工具 ====================

/** 内置类型到层级的映射 */
const builtinTypeToLayer: Record<BuiltinDSLType, DSLLayer> = {
  entity: 'domain',
  valueObject: 'domain',
  enum: 'domain',
  rule: 'domain',
  domainLogic: 'domain',
  repository: 'domain',
  service: 'domain',
  dto: 'application',
  constant: 'application',
  appService: 'application',
  page: 'presentation',
  component: 'presentation',
  extension: 'infrastructure',
};

/** 内置类型到子层级的映射 */
const builtinTypeToSubLayer: Record<BuiltinDSLType, DSLSubLayer> = {
  entity: 'model',
  valueObject: 'model',
  enum: 'model',
  rule: 'domain',
  domainLogic: 'domain',
  repository: 'repository',
  service: 'service',
  dto: 'dto',
  constant: 'dto',
  appService: 'appService',
  page: 'view',
  component: 'component',
  extension: 'extension',
};

/** 内置类型的中文标签 */
const builtinTypeLabels: Record<BuiltinDSLType, string> = {
  entity: '实体',
  valueObject: '值对象',
  enum: '枚举',
  rule: '规则',
  domainLogic: '领域逻辑',
  repository: 'Repository',
  service: 'Service',
  dto: 'DTO',
  constant: '常量',
  appService: 'AppService',
  page: 'Page',
  component: 'Component',
  extension: '扩展',
};

/** 内置类型的图标 */
const builtinTypeIcons: Record<BuiltinDSLType, string> = {
  entity: '🔵',
  valueObject: '🔶',
  enum: '🔷',
  rule: '✅',
  domainLogic: '💡',
  repository: '💾',
  service: '⚙️',
  dto: '📋',
  constant: '🎨',
  appService: '📱',
  page: '📄',
  component: '🧩',
  extension: '🔌',
};

/**
 * 获取类型的层级（支持内置 + 自定义）
 */
export function getTypeLayer(type: string): DSLLayer {
  return builtinTypeToLayer[type as BuiltinDSLType] 
    || dynamicTypeToLayer[type] 
    || 'custom';
}

/**
 * 获取类型的子层级（支持内置 + 自定义）
 */
export function getTypeSubLayer(type: string): DSLSubLayer {
  return builtinTypeToSubLayer[type as BuiltinDSLType] 
    || dynamicTypeToSubLayer[type] 
    || 'custom';
}

/**
 * 获取类型的标签（支持内置 + 自定义）
 */
export function getTypeLabel(type: string): string {
  return builtinTypeLabels[type as BuiltinDSLType] 
    || dynamicTypeLabels[type] 
    || type;
}

/**
 * 获取类型的图标（支持内置 + 自定义）
 */
export function getTypeIcon(type: string): string {
  return builtinTypeIcons[type as BuiltinDSLType] 
    || dynamicTypeIcons[type] 
    || '📦';
}

/** DSL 类型到层级的映射（兼容旧 API，推荐使用 getTypeLayer） */
export const typeToLayer: Record<string, DSLLayer> = new Proxy(
  {} as Record<string, DSLLayer>,
  {
    get(_, prop: string) {
      return getTypeLayer(prop);
    },
  }
);

/** DSL 类型到子层级的映射（兼容旧 API，推荐使用 getTypeSubLayer） */
export const typeToSubLayer: Record<string, DSLSubLayer> = new Proxy(
  {} as Record<string, DSLSubLayer>,
  {
    get(_, prop: string) {
      return getTypeSubLayer(prop);
    },
  }
);

/** DSL 类型的中文标签（兼容旧 API，推荐使用 getTypeLabel） */
export const typeLabels: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  {
    get(_, prop: string) {
      return getTypeLabel(prop);
    },
  }
);

/** DSL 类型的图标（兼容旧 API，推荐使用 getTypeIcon） */
export const typeIcons: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  {
    get(_, prop: string) {
      return getTypeIcon(prop);
    },
  }
);

// ==================== AST 元数据初始化 ====================

/**
 * AST 元数据项的接口
 */
export interface ASTMetadataItem {
  __type: DSLType;
  name: string;
  [key: string]: unknown;
}

/**
 * 从 AST 分析结果初始化 Metadata Store
 * 
 * 在应用启动时调用，将 vite-plugin 的 AST 分析结果注入到运行时 Store
 * 
 * @param astMetadata - AST 分析生成的元数据数组
 * @param options - 初始化选项
 * 
 * @example
 * ```typescript
 * import { runtimeMetadata } from 'virtual:ai-builder-metadata';
 * import { initMetadataFromAST } from '@qwe8652591/dsl-core';
 * 
 * // 应用启动时初始化
 * initMetadataFromAST(runtimeMetadata);
 * ```
 */
export function initMetadataFromAST(
  astMetadata: ASTMetadataItem[],
  options: {
    /** 是否覆盖已存在的元数据 */
    overwrite?: boolean;
    /** 是否输出调试日志 */
    debug?: boolean;
  } = {}
): void {
  const { overwrite = false, debug = false } = options;
  
  if (!Array.isArray(astMetadata)) {
    console.warn('[MetadataStore] initMetadataFromAST: 参数必须是数组');
    return;
  }
  
  let registered = 0;
  let skipped = 0;
  
  for (const item of astMetadata) {
    if (!item || !item.__type || !item.name) {
      if (debug) {
        console.warn('[MetadataStore] 跳过无效的元数据项:', item);
      }
      continue;
    }
    
    // 检查是否已存在
    const existing = metadataStore.get(item.name);
    if (existing && !overwrite) {
      if (debug) {
        console.log(`[MetadataStore] 跳过已存在: ${item.name}`);
      }
      skipped++;
      continue;
    }
    
    // 注册元数据
    metadataStore.register(item);
    registered++;
    
    if (debug) {
      console.log(`[MetadataStore] 从 AST 注册: ${item.__type} - ${item.name}`);
    }
  }
  
  console.log(`[MetadataStore] AST 初始化完成: 注册 ${registered} 项, 跳过 ${skipped} 项`);
}

/**
 * 清空所有元数据（主要用于测试）
 */
export function clearAllMetadata(): void {
  metadataStore.clear();
  console.log('[MetadataStore] 已清空所有元数据');
}

// ==================== 🆕 自定义类型注册 API ====================

/**
 * 注册自定义 DSL 类型
 * 
 * @example
 * ```typescript
 * // 1. 注册直接定义的类型
 * registerDSLType({
 *   type: 'workflow',
 *   layer: 'application',
 *   label: '工作流',
 *   icon: '🔄',
 *   defineMethod: 'function',
 * });
 * 
 * // 2. 注册派生类型（从现有元数据分析生成）
 * registerDSLType({
 *   type: 'entityRelation',
 *   layer: 'domain',
 *   label: '实体关系',
 *   icon: '🔗',
 *   defineMethod: 'derived',
 *   derivedFrom: ['entity'],
 *   derive: (store) => computeEntityRelations(store),
 * });
 * ```
 */
export function registerDSLType(config: CustomTypeConfig): void {
  metadataStore.registerType(config);
}

/**
 * 获取自定义类型配置
 */
export function getDSLTypeConfig(type: string): CustomTypeConfig | undefined {
  return metadataStore.getTypeConfig(type);
}

/**
 * 获取所有已注册的类型
 */
export function getAllDSLTypes(): string[] {
  return metadataStore.getAllTypes();
}

/**
 * 添加元数据变更监听器
 */
export function onMetadataChange(listener: MetadataChangeListener): () => void {
  return metadataStore.addListener(listener);
}

/**
 * 手动触发派生计算
 */
export function triggerDeriveMetadata(type?: string): void {
  metadataStore.triggerDerive(type);
}

// ==================== 🆕 工厂函数 API ====================

/**
 * 定义基础接口（用于工厂函数）
 */
export interface BaseDefinition {
  name: string;
  description?: string;
  comment?: string;
  [key: string]: unknown;
}

/**
 * 创建 define* 函数（函数式 DSL 工厂）
 * 
 * @example
 * ```typescript
 * // 1. 注册类型
 * registerDSLType({
 *   type: 'workflow',
 *   layer: 'application',
 *   label: '工作流',
 *   icon: '🔄',
 * });
 * 
 * // 2. 创建 define 函数
 * interface WorkflowDefinition extends BaseDefinition {
 *   steps: Array<{ name: string; action: string }>;
 *   transitions: Array<{ from: string; to: string }>;
 * }
 * 
 * const defineWorkflow = createDefiner<WorkflowDefinition>('workflow');
 * 
 * // 3. 使用
 * export const OrderWorkflow = defineWorkflow({
 *   name: 'OrderWorkflow',
 *   description: '订单审批流程',
 *   steps: [
 *     { name: 'draft', action: 'create' },
 *     { name: 'pending', action: 'submit' },
 *     { name: 'approved', action: 'approve' },
 *   ],
 *   transitions: [
 *     { from: 'draft', to: 'pending' },
 *     { from: 'pending', to: 'approved' },
 *   ],
 * });
 * ```
 */
export function createDefiner<T extends BaseDefinition>(type: string) {
  return function define(definition: Omit<T, '__type'>): T & { __type: string } {
    const result = { ...definition, __type: type } as T & { __type: string };
    registerMetadata(result);
    return result;
  };
}

/**
 * 创建装饰器（装饰器 DSL 工厂）
 * 
 * @example
 * ```typescript
 * // 1. 注册类型
 * registerDSLType({
 *   type: 'workflow',
 *   layer: 'application',
 *   label: '工作流',
 *   defineMethod: 'decorator',
 * });
 * 
 * // 2. 创建装饰器
 * interface WorkflowOptions {
 *   description?: string;
 *   initialState?: string;
 * }
 * 
 * const Workflow = createDecorator<WorkflowOptions>('workflow');
 * 
 * // 3. 使用
 * @Workflow({ description: '订单审批流程', initialState: 'draft' })
 * class OrderWorkflow {
 *   // ...
 * }
 * ```
 */
export function createDecorator<O extends Record<string, unknown> = Record<string, unknown>>(
  type: string
): (options?: O) => ClassDecorator {
  return function decorator(options?: O): ClassDecorator {
    return function (target: Function) {
      const definition = {
        name: target.name,
        __type: type,
        ...options,
        __class: target,
      };
      
      registerMetadata(definition);
      console.log(`[Decorator] 已注册 ${type}: ${target.name}`);
    };
  };
}

/**
 * 创建属性装饰器工厂
 * 
 * @example
 * ```typescript
 * const Step = createPropertyDecorator<{ action: string }>('workflowStep');
 * 
 * class OrderWorkflow {
 *   @Step({ action: 'create' })
 *   draft: string;
 * }
 * ```
 */
export function createPropertyDecorator<O extends Record<string, unknown> = Record<string, unknown>>(
  metadataKey: string | symbol
): (options: O) => PropertyDecorator {
  const key = typeof metadataKey === 'string' ? Symbol(metadataKey) : metadataKey;
  
  return function decorator(options: O): PropertyDecorator {
    return function (target: Object, propertyKey: string | symbol) {
      const existingMetadata = Reflect.getMetadata(key, target) || {};
      existingMetadata[propertyKey as string] = options;
      Reflect.defineMetadata(key, existingMetadata, target);
    };
  };
}

// ==================== 🆕 派生元数据工具 ====================

/**
 * 实体关系类型
 */
export interface EntityRelation {
  /** 源实体 */
  source: string;
  /** 目标实体 */
  target: string;
  /** 关系类型 */
  relationType: 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany' | 'Embedded';
  /** 字段名 */
  fieldName: string;
  /** 是否嵌入 */
  embedded?: boolean;
}

/**
 * 计算实体关系（派生元数据示例）
 * 
 * 从所有 entity 和 valueObject 的字段定义中分析关系
 * 
 * @example
 * ```typescript
 * registerDSLType({
 *   type: 'entityRelation',
 *   layer: 'domain',
 *   subLayer: 'derived',
 *   label: '实体关系',
 *   icon: '🔗',
 *   defineMethod: 'derived',
 *   derivedFrom: ['entity', 'valueObject'],
 *   derive: computeEntityRelations,
 * });
 * ```
 */
export function computeEntityRelations(store: DSLMetadataStore): DerivedMetadataItem[] {
  const relations: DerivedMetadataItem[] = [];
  
  // 获取所有实体
  const entities = store.getByType('entity');
  const valueObjects = store.getByType('valueObject');
  const allModels = new Map([...entities, ...valueObjects]);
  
  for (const [name, metadata] of allModels) {
    const definition = metadata.definition as Record<string, unknown>;
    const fields = definition.fields as Record<string, unknown> | undefined;
    
    if (!fields) continue;
    
    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      const field = fieldDef as Record<string, unknown>;
      
      // 检查是否有关系定义
      if (field.relation || field.target || field.embedded) {
        const targetDef = field.target as { name?: string } | (() => { name?: string }) | undefined;
        let targetName: string | undefined;
        
        if (typeof targetDef === 'function') {
          try {
            const resolved = targetDef();
            targetName = resolved?.name;
          } catch {
            // 忽略解析错误
          }
        } else if (targetDef) {
          targetName = targetDef.name;
        }
        
        if (targetName) {
          const relation: EntityRelation = {
            source: name,
            target: targetName,
            relationType: (field.relation as EntityRelation['relationType']) || 
              (field.embedded ? 'Embedded' : 'OneToOne'),
            fieldName,
            embedded: field.embedded as boolean,
          };
          
          relations.push({
            name: `${name}_${fieldName}_${targetName}`,
            __type: 'entityRelation',
            ...relation,
          });
        }
      }
    }
  }
  
  return relations;
}

/**
 * 预置的实体关系派生类型注册
 * 
 * 调用此函数启用实体关系自动分析
 * 
 * @example
 * ```typescript
 * import { enableEntityRelationDerive } from '@qwe8652591/dsl-core';
 * 
 * // 在应用启动时调用
 * enableEntityRelationDerive();
 * ```
 */
export function enableEntityRelationDerive(): void {
  registerDSLType({
    type: 'entityRelation',
    layer: 'domain',
    subLayer: 'derived',
    label: '实体关系',
    icon: '🔗',
    defineMethod: 'derived',
    derivedFrom: ['entity', 'valueObject'],
    derive: computeEntityRelations,
    description: '从实体定义中自动分析的关系图',
  });
}

/**
 * 获取实体关系列表
 */
export function getEntityRelations(): EntityRelation[] {
  const relations = metadataStore.getByType('entityRelation');
  return Array.from(relations.values()).map(m => m.definition as EntityRelation);
}

