/**
 * DSL Metadata Store
 * 
 * 统一管理所有 DSL 定义的元数据
 * - 定义时自动注册
 * - 支持按类型、名称查询
 * - 支持运行时访问所有元数据
 */

// ==================== 类型定义 ====================

/** DSL 类型 */
export type DSLType = 
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
  | 'component';

/** DSL 层级（DDD 分层） */
export type DSLLayer = 'domain' | 'application' | 'presentation';

/** DSL 子层级 */
export type DSLSubLayer = 
  | 'model'      // 领域模型（Entity, ValueObject, Enum）
  | 'domain'     // 领域规则（Rule, DomainLogic）
  | 'repository' // 数据访问
  | 'service'    // 内部服务
  | 'dto'        // 数据传输对象
  | 'appService' // 应用服务
  | 'view'       // 视图/页面
  | 'component'; // 自定义组件

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
}

// ==================== Metadata Store 实现 ====================

/**
 * DSL Metadata Store
 * 
 * 单例模式，统一管理所有 DSL 元数据
 */
class DSLMetadataStore {
  /** 所有元数据（按名称索引） */
  private byName = new Map<string, BaseDSLMetadata>();
  
  /** 按类型索引 */
  private byType = new Map<DSLType, Map<string, BaseDSLMetadata>>();
  
  /** 初始化类型索引 */
  constructor() {
    const types: DSLType[] = [
      'entity', 'valueObject', 'enum', 'dto', 'constant',
      'rule', 'domainLogic', 'repository', 'service', 'appService', 
      'page', 'component'
    ];
    types.forEach(type => this.byType.set(type, new Map()));
  }
  
  /**
   * 注册 DSL 定义
   */
  register(definition: unknown): void {
    if (!definition || typeof definition !== 'object') return;
    
    const obj = definition as Record<string, unknown>;
    const type = obj.__type as DSLType;
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
    
    // 创建元数据
    const metadata: BaseDSLMetadata = {
      name,
      __type: type,
      comment: (obj.comment || obj.description || 
        (obj.meta && typeof obj.meta === 'object' ? (obj.meta as Record<string, unknown>).description : undefined)) as string | undefined,
      definition,
      registeredAt: Date.now(),
    };
    
    // 注册到索引
    this.byName.set(name, metadata);
    this.byType.get(type)?.set(name, metadata);
    
    console.log(`[MetadataStore] 已注册: ${type} - ${name}`);
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
  getByType(type: DSLType): Map<string, BaseDSLMetadata> {
    return this.byType.get(type) || new Map();
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
    };
  }
  
  /**
   * 获取统计信息
   */
  getStats(): Record<DSLType, number> {
    const stats: Record<string, number> = {};
    for (const [type, map] of this.byType) {
      stats[type] = map.size;
    }
    return stats as Record<DSLType, number>;
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

/** DSL 类型到层级的映射 */
export const typeToLayer: Record<DSLType, DSLLayer> = {
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
};

/** DSL 类型到子层级的映射 */
export const typeToSubLayer: Record<DSLType, DSLSubLayer> = {
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
};

/** DSL 类型的中文标签 */
export const typeLabels: Record<DSLType, string> = {
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
};

/** DSL 类型的图标 */
export const typeIcons: Record<DSLType, string> = {
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
};

